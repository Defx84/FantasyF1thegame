const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Send email function using Resend directly
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log('📧 Sending email via Resend to:', to);
    
    const data = await resend.emails.send({
      from: 'The Fantasy F1 Game <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log('✅ Email sent successfully via Resend:', data);
    console.log('📧 Full Resend response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    throw error;
  }
};

// Test email connection (now tests Resend directly)
const testEmailConnection = async () => {
  try {
    console.log('🔧 Testing Resend connection...');
    
    // Send a test email to verify Resend works
    const testResponse = await resend.emails.send({
      from: 'The Fantasy F1 Game <onboarding@resend.dev>',
      to: ['test@example.com'], // This will fail but we can check if Resend is accessible
      subject: 'Test Connection',
      html: '<p>This is a test email to verify the connection.</p>',
    });

    console.log('✅ Resend connection successful');
    return true;
  } catch (error) {
    if (error.message.includes('Invalid email')) {
      // Expected error for invalid email, but Resend is accessible
      console.log('✅ Resend connection successful (got expected validation error)');
      return true;
    }
    console.error('❌ Resend connection failed:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConnection
};