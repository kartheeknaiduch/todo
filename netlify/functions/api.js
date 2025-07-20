// Simplified Netlify Function for debugging
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User schema (inline to avoid file dependency issues)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  notificationPreferences: {
    enabled: { type: Boolean, default: true },
    reminderTime: { type: Number, default: 12 },
    customMessage: { type: String, default: '' }
  }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Todo schema (inline to avoid file dependency issues)
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  deadline: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Todo = mongoose.models.Todo || mongoose.model('Todo', todoSchema);

// MongoDB connection
let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    const connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    cachedDb = connection;
    console.log('✅ Connected to MongoDB');
    return cachedDb;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Main handler
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Extract path and method
    const path = event.path.replace('/.netlify/functions/api', '');
    const method = event.httpMethod;
    
    console.log(`📝 ${method} ${path}`);
    console.log('📝 Body:', event.body);
    console.log('📝 Environment check:', {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET
    });

    // Health check endpoint
    if (path === '/health' && method === 'GET') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'API is working!',
          timestamp: new Date().toISOString(),
          env: {
            hasMongoUri: !!process.env.MONGODB_URI,
            hasJwtSecret: !!process.env.JWT_SECRET
          }
        })
      };
    }

    // Connect to database for other endpoints
    await connectToDatabase();

    // Registration endpoint
    if (path === '/register' && method === 'POST') {
      const { username, email, password } = JSON.parse(event.body);
      
      console.log('📝 Registration attempt:', { username, email });

      // Validation
      if (!username || !email || !password) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: 'Username, email, and password are required',
            received: { username: !!username, email: !!email, password: !!password }
          })
        };
      }

      // Check if user exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });
      
      if (existingUser) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: 'User with this email or username already exists' 
          })
        };
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = new User({
        username,
        email,
        password: hashedPassword
      });

      await newUser.save();
      console.log('✅ User created successfully:', username);

      return {
        statusCode: 201,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'User created successfully',
          user: { username, email }
        })
      };
    }

    // Login endpoint
    if (path === '/login' && method === 'POST') {
      const { email, password } = JSON.parse(event.body);
      
      console.log('📝 Login attempt:', email);

      const user = await User.findOne({ email });
      if (!user) {
        return {
          statusCode: 401,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return {
          statusCode: 401,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Login successful',
          token,
          email: user.email
        })
      };
    }

    // JWT Authentication helper function
    const authenticateToken = (authHeader) => {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No token provided');
      }
      
      const token = authHeader.substring(7);
      try {
        return jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        throw new Error('Invalid token');
      }
    };

    // Protected routes require authentication
    if (path.startsWith('/todos')) {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      let user;
      
      try {
        user = authenticateToken(authHeader);
      } catch (error) {
        return {
          statusCode: 401,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Unauthorized: ' + error.message })
        };
      }

      // GET /todos - Get all todos for user
      if (path === '/todos' && method === 'GET') {
        const todos = await Todo.find({ userId: user.userId }).sort({ createdAt: -1 });
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(todos)
        };
      }

      // POST /todos - Create new todo
      if (path === '/todos' && method === 'POST') {
        const { title, description, priority, deadline } = JSON.parse(event.body);
        
        if (!title) {
          return {
            statusCode: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Title is required' })
          };
        }

        const newTodo = new Todo({
          title,
          description,
          priority: priority || 'Medium',
          deadline: deadline ? new Date(deadline) : null,
          userId: user.userId
        });

        await newTodo.save();
        return {
          statusCode: 201,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(newTodo)
        };
      }

      // PUT /todos/:id - Update todo
      if (path.match(/^\/todos\/[a-f\d]{24}$/) && method === 'PUT') {
        const todoId = path.split('/')[2];
        const updateData = JSON.parse(event.body);
        
        const todo = await Todo.findOneAndUpdate(
          { _id: todoId, userId: user.userId },
          updateData,
          { new: true }
        );
        
        if (!todo) {
          return {
            statusCode: 404,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Todo not found' })
          };
        }

        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(todo)
        };
      }

      // DELETE /todos/:id - Delete todo
      if (path.match(/^\/todos\/[a-f\d]{24}$/) && method === 'DELETE') {
        const todoId = path.split('/')[2];
        
        const todo = await Todo.findOneAndDelete({ _id: todoId, userId: user.userId });
        
        if (!todo) {
          return {
            statusCode: 404,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Todo not found' })
          };
        }

        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Todo deleted successfully' })
        };
      }

      // GET /users - Get current user's information and preferences
      if (path === '/users' && method === 'GET') {
        console.log('📝 Getting user information for:', user.email);

        const currentUser = await User.findOne({ email: user.email });

        if (!currentUser) {
          return {
            statusCode: 404,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'User not found' })
          };
        }

        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: currentUser.email,
            notificationPreferences: currentUser.notificationPreferences || {
              enabled: true,
              reminderTime: 12,
              customMessage: ''
            }
          })
        };
      }

      // POST /users - Update user notification preferences
      if (path === '/users' && method === 'POST') {
        const { email, notificationPreferences } = JSON.parse(event.body);
        
        console.log('📝 Updating user notification preferences:', { email, notificationPreferences });

        const updatedUser = await User.findOneAndUpdate(
          { email: user.email },
          { 
            notificationPreferences: {
              enabled: notificationPreferences?.enabled ?? true,
              reminderTime: notificationPreferences?.reminderTime ?? 12,
              customMessage: notificationPreferences?.customMessage ?? ''
            }
          },
          { new: true, runValidators: true }
        );

        if (!updatedUser) {
          return {
            statusCode: 404,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'User not found' })
          };
        }

        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: 'User preferences updated successfully',
            user: {
              email: updatedUser.email,
              notificationPreferences: updatedUser.notificationPreferences
            }
          })
        };
      }
    }

    // Default response for unmatched routes
    return {
      statusCode: 404,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Endpoint not found',
        path,
        method,
        availableEndpoints: [
          '/health (GET)', 
          '/register (POST)', 
          '/login (POST)',
          '/todos (GET/POST) - requires auth',
          '/todos/:id (PUT/DELETE) - requires auth',
          '/users (GET/POST) - requires auth'
        ]
      })
    };

  } catch (error) {
    console.error('❌ Function error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
