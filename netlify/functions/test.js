const { handler } = require('./api.js');

// Simple test function
const testHealthCheck = async () => {
  const event = {
    httpMethod: 'GET',
    path: '/api/health',
    headers: {},
    body: null
  };
  
  const context = {
    callbackWaitsForEmptyEventLoop: false
  };
  
  try {
    const result = await handler(event, context);
    console.log('Health check result:', result);
  } catch (error) {
    console.error('Health check error:', error);
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testHealthCheck();
}

module.exports = { testHealthCheck };
