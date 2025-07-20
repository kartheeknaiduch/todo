const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const serverless = require('serverless-http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config();

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with better error handling
let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not set in environment variables');
    }
    
    console.log('Connecting to MongoDB...');
    
    // Disconnect any existing connections first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    const connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      bufferCommands: false,
      bufferMaxEntries: 0
    });
    
    cachedDb = connection;
    console.log('MongoDB connected successfully');
    return cachedDb;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    cachedDb = null;
    throw error;
  }
};

// User Schema with better validation
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  notificationPreferences: {
    enabled: { type: Boolean, default: true },
    reminderTime: { type: Number, default: 12 },
    customMessage: { type: String, default: '' }
  }
}, { 
  timestamps: true,
  collection: 'users'
});

// Create indexes
userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Todo Schema
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  deadline: { type: Date, required: true },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  completed: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
  timestamps: true,
  collection: 'todos'
});

const Todo = mongoose.models.Todo || mongoose.model('Todo', todoSchema);

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. Invalid token format.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Routes
// Health check with detailed info
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Netlify Functions API is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: {
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
      EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
      EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Not set'
    }
  });
});

// User registration with detailed error handling
app.post('/api/users/register', async (req, res) => {
  try {
    console.log('Registration attempt started');
    
    // Connect to database
    await connectToDatabase();
    console.log('Database connected for registration');
    
    const { email, password } = req.body;
    
    // Detailed validation
    if (!email) {
      console.log('Registration failed: Email missing');
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!password) {
      console.log('Registration failed: Password missing');
      return res.status(400).json({ error: 'Password is required' });
    }
    
    if (password.length < 6) {
      console.log('Registration failed: Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      console.log('Registration failed: Invalid email format');
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    
    console.log(`Checking if user exists: ${email}`);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('Registration failed: User already exists');
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    console.log('User does not exist, proceeding with registration');
    
    // Hash password
    console.log('Hashing password...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');
    
    // Create user
    console.log('Creating new user...');
    const userData = {
      email: email.toLowerCase(),
      password: hashedPassword,
      notificationPreferences: {
        enabled: true,
        reminderTime: 12,
        customMessage: ''
      }
    };
    
    const user = new User(userData);
    console.log('User object created, saving to database...');
    
    const savedUser = await user.save();
    console.log('User saved successfully:', savedUser._id);
    
    res.status(201).json({ 
      message: 'User registered successfully',
      userId: savedUser._id,
      email: savedUser.email
    });
    
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: validationErrors.join(', ') });
    }
    
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(500).json({ error: 'Database connection error. Please try again.' });
    }
    
    res.status(500).json({ 
      error: 'Registration failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// User login with detailed error handling
app.post('/api/users/login', async (req, res) => {
  try {
    console.log('Login attempt started');
    
    await connectToDatabase();
    console.log('Database connected for login');
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Login failed: Missing credentials');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    console.log(`Looking for user: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    console.log('User found, checking password...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Password mismatch');
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    console.log('Password verified, generating token...');
    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    console.log('Login successful');
    res.status(200).json({ 
      token, 
      email: user.email,
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get todos
app.get('/api/todos', auth, async (req, res) => {
  try {
    await connectToDatabase();
    const todos = await Todo.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Create todo
app.post('/api/todos', auth, async (req, res) => {
  try {
    await connectToDatabase();
    const { title, deadline, priority } = req.body;
    
    if (!title || !deadline) {
      return res.status(400).json({ error: 'Title and deadline are required' });
    }
    
    const todo = new Todo({
      title,
      deadline,
      priority: priority || 'Medium',
      userId: req.user.userId
    });
    
    const savedTodo = await todo.save();
    res.status(201).json(savedTodo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update todo
app.put('/api/todos/:id', auth, async (req, res) => {
  try {
    await connectToDatabase();
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.status(200).json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete todo
app.delete('/api/todos/:id', auth, async (req, res) => {
  try {
    await connectToDatabase();
    const todo = await Todo.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.status(200).json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// User preferences
app.post('/api/users', auth, async (req, res) => {
  try {
    await connectToDatabase();
    const { notificationPreferences } = req.body;
    
    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      { 
        notificationPreferences: {
          enabled: notificationPreferences?.enabled ?? true,
          reminderTime: notificationPreferences?.reminderTime ?? 12,
          customMessage: notificationPreferences?.customMessage ?? ''
        }
      },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Wrapper function for Netlify
const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    console.log('=== Function invoked ===');
    console.log('Method:', event.httpMethod);
    console.log('Path:', event.path);
    console.log('Environment check:', {
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set'
    });
    
    const result = await serverless(app)(event, context);
    console.log('Function execution completed successfully');
    return result;
    
  } catch (error) {
    console.error('=== Function error ===');
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

module.exports = { handler };
