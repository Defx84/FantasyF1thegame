const axios = require('axios');

// Vercel function URL for sending emails
const VERCEL_EMAIL_URL = process.env.VERCEL_EMAIL_URL || 'https://thefantasyf1game.com/api/send-email';

// Send email function using Vercel + Resend
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const response = await axios.post(VERCEL_EMAIL_URL, {
      to,
      subject,
      text,
      html,
      from: 'The Fantasy F1 Game <onboarding@resend.dev>'
    });

    console.log('✅ Email sent successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    throw error;
  }
};

// Test email connection (now tests Vercel function)
const testEmailConnection = async () => {
  try {
    console.log('🔧 Testing Vercel email function...');
    
    // Send a test email to verify the function works
    const testResponse = await axios.post(VERCEL_EMAIL_URL, {
      to: 'test@example.com', // This will fail but we can check if the function is accessible
      subject: 'Test Connection',
      html: '<p>This is a test email to verify the connection.</p>',
      from: 'The Fantasy F1 Game <onboarding@resend.dev>'
    });

    console.log('✅ Vercel email function is accessible');
    return true;
  } catch (error) {
    if (error.response?.status === 400) {
      // Expected error for invalid email, but function is accessible
      console.log('✅ Vercel email function is accessible (got expected validation error)');
      return true;
    }
    console.error('❌ Vercel email function failed:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConnection
};