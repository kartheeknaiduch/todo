// Quick test script for registration endpoint
// Run this after setting up environment variables in Netlify

const testRegistration = async () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPass123!'
  };

  console.log('Testing registration with:', testUser);

  try {
    const response = await fetch('https://your-netlify-site.netlify.app/.netlify/functions/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', data);
    
    if (response.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed:', data.message || data.error);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

// Uncomment and replace with your actual Netlify URL to test
// testRegistration();

console.log('Replace "your-netlify-site" with your actual site name and uncomment the last line to test');
