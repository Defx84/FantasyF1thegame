import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email sending API route for Vercel (App Router)
export async function POST(request) {
  try {
    const { to, subject, html, text, from } = await request.json();

    // Validate required fields
    if (!to || !subject || !html) {
      return Response.json({ 
        error: 'Missing required fields: to, subject, html' 
      }, { status: 400 });
    }

    // Send email using Resend
    const data = await resend.emails.send({
      from: from || 'The Fantasy F1 Game <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log('✅ Email sent successfully:', data);
    return Response.json({ 
      success: true, 
      messageId: data.id,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return Response.json({ 
      error: 'Failed to send email',
      details: error.message 
    }, { status: 500 });
  }
}

// Handle other methods
export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
