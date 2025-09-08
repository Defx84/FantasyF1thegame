import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html, text, from } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        error: 'Missing required fields: to, subject, html' 
      });
    }

    // Send email using Resend
    const data = await resend.emails.send({
      from: from || 'The Fantasy F1 Game <noreply@thefantasyf1game.com>',
      to: [to],
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log('✅ Email sent successfully:', data);
    res.status(200).json({ 
      success: true, 
      messageId: data.id,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}
