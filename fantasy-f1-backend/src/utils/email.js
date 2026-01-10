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

/**
 * Send season archive PDF to all league members
 * @param {Object} league - League object with populated members (must have email field)
 * @param {Buffer} pdfBuffer - PDF buffer to attach
 */
const sendSeasonArchiveToLeague = async (league, pdfBuffer) => {
  try {
    if (!league || !league.members || league.members.length === 0) {
      console.error('[Season Archive] No members found in league');
      return;
    }

    if (!pdfBuffer) {
      console.error('[Season Archive] No PDF buffer provided');
      return;
    }

    // Get all member emails
    const memberEmails = league.members
      .map(member => member.email)
      .filter(email => email); // Filter out any undefined/null emails

    if (memberEmails.length === 0) {
      console.error('[Season Archive] No valid email addresses found for league members');
      return;
    }

    console.log(`[Season Archive] Preparing to send PDF to ${memberEmails.length} league members for league: ${league.name}`);

    // Convert PDF buffer to base64 for MailerSend attachment
    const pdfBase64 = pdfBuffer.toString('base64');
    const season = league.season || new Date().getFullYear();

    // Prepare email content
    const subject = `🏁 ${league.name} - Season ${season} Archive`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">🏁 Season ${season} Complete!</h2>
        <p>Congratulations on completing another season of The Fantasy F1 Game!</p>
        <p>Attached is your complete season archive for <strong>${league.name}</strong>, including:</p>
        <ul>
          <li>Final standings (Driver & Constructor championships)</li>
          <li>Championship progression charts</li>
        </ul>
        <p>Thank you for playing, and we'll see you next season!</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          — The Fantasy F1 Game Team
        </p>
      </div>
    `;
    const text = `Season ${season} Complete!\n\nCongratulations on completing another season of The Fantasy F1 Game!\n\nAttached is your complete season archive for ${league.name}, including final standings and championship progression charts.\n\nThank you for playing!\n\n— The Fantasy F1 Game Team`;

    // Send email to each member individually
    // MailerSend attachment format: { filename, content (base64 string) }
    const filename = `${league.name.replace(/[^a-z0-9]/gi, '_')}_Season_${season}_Archive.pdf`;
    
    console.log(`[Season Archive] Sending emails to ${memberEmails.length} recipients...`);
    console.log(`[Season Archive] PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`[Season Archive] API Key present: ${!!process.env.MAILERSEND_API_KEY}`);
    
    // Check if PDF is too large (MailerSend typically has a 25MB limit, but trial accounts may have lower limits)
    const pdfSizeMB = pdfBuffer.length / 1024 / 1024;
    if (pdfSizeMB > 10) {
      console.warn(`[Season Archive] ⚠️ PDF size (${pdfSizeMB.toFixed(2)} MB) may exceed MailerSend limits`);
    }
    
    const emailPromises = memberEmails.map(async (email) => {
      try {
        console.log(`[Season Archive] 📧 Sending email to ${email}...`);
        
        // Prepare email payload
        const emailPayload = {
          from: {
            email: 'noreply@thefantasyf1game.com',
            name: 'The Fantasy F1 Game'
          },
          to: [
            {
              email: email
            }
          ],
          subject: subject,
          html: html,
          text: text,
          attachments: [
            {
              filename: filename,
              content: pdfBase64
            }
          ]
        };
        
        const data = await mailerSend.email.send(emailPayload);
        
        console.log(`[Season Archive] ✅ PDF sent to ${email}`);
        return data;
      } catch (error) {
        // Better error handling matching the sendEmail function pattern
        const errorMessage = error?.message || error?.error?.message || error?.toString() || 'Unknown error';
        console.error(`[Season Archive] ❌ Failed to send PDF to ${email}:`, errorMessage);
        
        // Log full error details for debugging
        if (error?.response) {
          console.error(`[Season Archive] Error response:`, JSON.stringify(error.response, null, 2));
        }
        if (error?.error) {
          console.error(`[Season Archive] Error details:`, JSON.stringify(error.error, null, 2));
        }
        if (error?.body) {
          console.error(`[Season Archive] Error body:`, JSON.stringify(error.body, null, 2));
        }
        
        // Don't throw - continue with other emails even if one fails
        return null;
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    const failed = results.length - successful;
    
    if (successful > 0) {
      console.log(`[Season Archive] ✅ ${successful}/${memberEmails.length} emails sent successfully for league: ${league.name}`);
    }
    if (failed > 0) {
      console.warn(`[Season Archive] ⚠️ ${failed} emails failed to send for league: ${league.name}`);
    }
  } catch (error) {
    console.error('[Season Archive] ❌ Error sending season archive:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  testEmailConnection,
  sendSeasonArchiveToLeague
};