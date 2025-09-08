const axios = require('axios');

// Vercel function URL for sending emails
const VERCEL_EMAIL_URL = process.env.VERCEL_EMAIL_URL || 'https://thefantasyf1game.com/api/send-email';

// Send email function using Vercel + Resend
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log('📧 Sending email via Vercel function to:', to);
    console.log('📧 Subject:', subject);
    
    const response = await axios.post(VERCEL_EMAIL_URL, {
      to,
      subject,
      text,
      html,
      from: 'The Fantasy F1 Game <noreply@thefantasyf1game.com>'
    });

    console.log('✅ Email sent successfully via Vercel:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    console.error('❌ Email error details:', error.response?.data || error);
    throw error;
  }
};

// Test email connection (now tests Vercel function)
const testEmailConnection = async () => {
  try {
    console.log('🔧 Testing Vercel email function...');
    console.log('📧 Vercel Function URL:', VERCEL_EMAIL_URL);
    
    // Send a test email to verify the function works
    const testResponse = await axios.post(VERCEL_EMAIL_URL, {
      to: 'test@example.com', // This will fail but we can check if the function is accessible
      subject: 'Test Connection',
      html: '<p>This is a test email to verify the connection.</p>',
      from: 'The Fantasy F1 Game <noreply@thefantasyf1game.com>'
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
    console.error('❌ Full error:', error.response?.data || error);
    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConnection
};