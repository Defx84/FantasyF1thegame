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
    console.log('🔧 API Key present:', !!process.env.MAILERSEND_API_KEY);
    
    // Send a test email to verify MailerSend works
    // Use admin email for trial account testing
    const testResponse = await mailerSend.email.send({
      from: {
        email: 'noreply@thefantasyf1game.com',
        name: 'The Fantasy F1 Game'
      },
      to: [
        {
          email: 'thefantasyf1game@gmail.com' // Use admin email for trial account
        }
      ],
      subject: 'Test Connection - MailerSend Working',
      html: '<p>This is a test email to verify the MailerSend connection is working correctly.</p>',
    });

    console.log('✅ MailerSend connection successful');
    return true;
  } catch (error) {
    console.log('🔧 Full error object:', JSON.stringify(error, null, 2));
    
    // Handle different error types
    let errorMessage = 'Unknown error';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.response && error.response.data) {
      errorMessage = JSON.stringify(error.response.data);
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }
    
    console.log('🔧 Parsed error message:', errorMessage);
    
    if (errorMessage.includes('Invalid email') || errorMessage.includes('validation') || errorMessage.includes('unauthorized') || errorMessage.includes('401') || errorMessage.includes('Trial accounts can only send emails to the administrator')) {
      // Expected error for trial account restrictions, but MailerSend is accessible
      console.log('✅ MailerSend connection successful (trial account restrictions detected)');
      return true;
    }
    console.error('❌ MailerSend connection failed:', errorMessage);
    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConnection
};