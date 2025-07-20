// Minimal test function with no dependencies
exports.handler = async (event, context) => {
  console.log('🚀 Simple function called');
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Basic info
  const response = {
    message: 'Hello from Netlify Functions!',
    timestamp: new Date().toISOString(),
    method: event.httpMethod,
    path: event.path,
    environment: {
      MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'not set'
    }
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(response, null, 2)
  };
};
