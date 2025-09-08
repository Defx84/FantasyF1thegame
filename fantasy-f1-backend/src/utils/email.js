const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Add timeout and connection settings
  connectionTimeout: 10000, // 10 seconds (reduced for faster failure)
  greetingTimeout: 10000,   // 10 seconds
  socketTimeout: 10000,     // 10 seconds
  // Add retry logic
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  // Add debug info
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
});

// Send email function (reverted to original working version)
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log('📧 Sending email to:', to);
    console.log('📧 SMTP Config - Host:', process.env.EMAIL_HOST);
    console.log('📧 SMTP Config - Port:', process.env.EMAIL_PORT);
    console.log('📧 SMTP Config - User:', process.env.EMAIL_USER);
    console.log('📧 SMTP Config - From: thefantasyf1game@gmail.com (actual address being used)');
    
    const info = await transporter.sendMail({
      from: 'thefantasyf1game@gmail.com', // Must match the SMTP user for Gmail authentication
      to,
      subject,
      text,
      html
    });

    console.log('✅ Email sent successfully');
    return info;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    console.error('❌ Email error details:', error);
    throw error;
  }
};

// Test email connection
const testEmailConnection = async () => {
  try {
    console.log('🔧 Testing email connection...');
    console.log('📧 SMTP Configuration Check:');
    console.log('  - Host:', process.env.EMAIL_HOST);
    console.log('  - Port:', process.env.EMAIL_PORT);
    console.log('  - Secure:', process.env.EMAIL_PORT === '465');
    console.log('  - User:', process.env.EMAIL_USER);
    console.log('  - From:', process.env.EMAIL_FROM);
    console.log('  - Pass:', process.env.EMAIL_PASS ? '***SET***' : '***NOT SET***');
    
    await transporter.verify();
    console.log('✅ Email connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email connection failed:', error.message);
    console.error('❌ Full error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConnection
}; 