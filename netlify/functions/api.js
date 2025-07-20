// Simplified Netlify Function for debugging
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User schema (inline to avoid file dependency issues)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

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

    // Default response for unmatched routes
    return {
      statusCode: 404,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Endpoint not found',
        path,
        method,
        availableEndpoints: ['/health (GET)', '/register (POST)', '/login (POST)']
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
