const { MailerSend } = require('mailersend');

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

// Send email function using MailerSend
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log('📧 Sending email via MailerSend to:', to);
    
    const data = await mailerSend.email.send({
      from: {
        email: 'noreply@thefantasyf1game.com',
        name: 'The Fantasy F1 Game'
      },
      to: [
        {
          email: to
        }
      ],
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log('✅ Email sent successfully via MailerSend:', data);
    return data;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    throw error;
  }
};

// Test email connection (now tests MailerSend directly)
const testEmailConnection = async () => {
  try {
    console.log('🔧 Testing MailerSend connection...');
    
    // Send a test email to verify MailerSend works
    const testResponse = await mailerSend.email.send({
      from: {
        email: 'noreply@thefantasyf1game.com',
        name: 'The Fantasy F1 Game'
      },
      to: [
        {
          email: 'test@example.com'
        }
      ],
      subject: 'Test Connection',
      html: '<p>This is a test email to verify the connection.</p>',
    });

    console.log('✅ MailerSend connection successful');
    return true;
  } catch (error) {
    if (error.message.includes('Invalid email') || error.message.includes('validation')) {
      // Expected error for invalid email, but MailerSend is accessible
      console.log('✅ MailerSend connection successful (got expected validation error)');
      return true;
    }
    console.error('❌ MailerSend connection failed:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConnection
};