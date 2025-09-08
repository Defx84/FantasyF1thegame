const axios = require('axios');

async function testVercelAPI() {
  try {
    console.log('🧪 Testing Vercel API route...');
    
    const response = await axios.post('https://thefantasyf1game.com/api/send-email', {
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>This is a test email.</p>',
      from: 'The Fantasy F1 Game <onboarding@resend.dev>'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('✅ Vercel API response:', response.status, response.data);
    return true;
  } catch (error) {
    console.error('❌ Vercel API error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

testVercelAPI();
