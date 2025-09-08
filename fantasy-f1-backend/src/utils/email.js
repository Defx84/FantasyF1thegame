const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email function
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log('📧 Email service - Starting to send email');
    console.log('📧 Email service - To:', to);
    console.log('📧 Email service - Subject:', subject);
    console.log('📧 Email service - From:', process.env.EMAIL_FROM);
    console.log('📧 Email service - Host:', process.env.EMAIL_HOST);
    console.log('📧 Email service - Port:', process.env.EMAIL_PORT);
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('❌ Error details:', error.message);
    throw error;
  }
};

module.exports = {
  sendEmail
}; 