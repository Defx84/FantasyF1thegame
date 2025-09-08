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
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000,     // 60 seconds
  // Add retry logic
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  // Add debug info
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
});

// Send email function with timeout
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log('📧 Sending email to:', to);
    console.log('📧 Email subject:', subject);
    console.log('📧 Email from:', process.env.EMAIL_FROM);
    
    // Add timeout wrapper to prevent hanging
    const emailPromise = transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000);
    });
    
    console.log('📧 About to call transporter.sendMail...');
    const info = await Promise.race([emailPromise, timeoutPromise]);
    
    console.log('✅ Email sent successfully');
    return info;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    throw error;
  }
};

// Test email connection
const testEmailConnection = async () => {
  try {
    console.log('🔧 Testing email connection...');
    
    await transporter.verify();
    console.log('✅ Email connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email connection failed:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConnection
}; 