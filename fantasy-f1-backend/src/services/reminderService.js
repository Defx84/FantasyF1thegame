const { sendEmail } = require('../utils/email');
const User = require('../models/User');
const RaceCalendar = require('../models/RaceCalendar');
const { format, addDays, isSameDay } = require('date-fns');

// Country to flag emoji mapping
const COUNTRY_FLAGS = {
  'Australia': '🇦🇺',
  'Bahrain': '🇧🇭',
  'Saudi Arabia': '🇸🇦',
  'Japan': '🇯🇵',
  'China': '🇨🇳',
  'Miami': '🇺🇸',
  'Emilia Romagna': '🇮🇹',
  'Monaco': '🇲🇨',
  'Canada': '🇨🇦',
  'Spain': '🇪🇸',
  'Austria': '🇦🇹',
  'Great Britain': '🇬🇧',
  'Hungary': '🇭🇺',
  'Belgium': '🇧🇪',
  'Netherlands': '🇳🇱',
  'Italy': '🇮🇹',
  'Azerbaijan': '🇦🇿',
  'Singapore': '🇸🇬',
  'United States': '🇺🇸',
  'Mexico': '🇲🇽',
  'Brazil': '🇧🇷',
  'Qatar': '🇶🇦',
  'Abu Dhabi': '🇦🇪'
};

// Get country flag emoji
function getCountryFlag(country) {
  return COUNTRY_FLAGS[country] || '🏁';
}

// Format time for UK timezone (simplified approach)
function formatUKTime(date) {
  // Convert to UK time (UTC+1 in summer, UTC+0 in winter)
  // This is a simplified approach - for production, consider using a proper timezone library
  const ukOffset = 1; // BST offset (adjust for GMT in winter)
  const ukTime = new Date(date.getTime() + (ukOffset * 60 * 60 * 1000));
  return format(ukTime, 'EEEE, MMMM do \'at\' HH:mm');
}

// Generate email HTML template
function generateEmailHTML(username, race) {
  const countryFlag = getCountryFlag(race.country);
  const qualifyingTime = formatUKTime(race.qualifyingStart);
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
      <!-- Banner -->
      <img src="https://thefantasyf1game.com/email-banner.png" 
           alt="TheFantasyF1Game" 
           style="max-width: 100%; height: auto; display: block; margin: 0 auto 20px; border-radius: 8px;">
      
      <!-- Content -->
      <h2 style="color: #dc2626; text-align: center;">Hi ${username},</h2>
      
      <p style="font-size: 16px; line-height: 1.6;">It's racing weekend! Do not forget your selections for this race.</p>
      
      <p style="font-size: 16px; line-height: 1.6;">Make sure you've chosen your:</p>
      <ul style="font-size: 16px; line-height: 1.8;">
        <li><strong>Main driver</strong></li>
        <li><strong>Reserve driver</strong></li>
        <li><strong>Team</strong></li>
      </ul>
      
      <p style="font-size: 16px; line-height: 1.6;">Selections close 5 minutes before qualifying (or sprint qualifying on sprint weekends). Once the deadline passes, your lineup will be locked, and you won't be able to make changes.</p>
      
      <p style="font-size: 16px; line-height: 1.6; font-weight: bold; color: #dc2626;">Stay ahead of the competition—set your picks now and secure your points!</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://thefantasyf1game.com" 
           style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
          Login at thefantasyf1game.com
        </a>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6;">Good luck for the race weekend,<br><strong>The Fantasy F1 Game Team</strong></p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="font-size: 14px; color: #666; line-height: 1.5;">
        We know that no one likes spam. If you do not need this reminder, you can opt out by simply logging in, go to your profile and opt out of the reminder.
      </p>
      
      <p style="font-size: 14px; color: #666; line-height: 1.5;">
        Follow us on Instagram at <a href="https://instagram.com/thefantasyf1game" style="color: #dc2626; text-decoration: none;">@thefantasyf1game</a>
      </p>
    </div>
  `;
}

// Generate email text template
function generateEmailText(username, race) {
  const countryFlag = getCountryFlag(race.country);
  const qualifyingTime = formatUKTime(race.qualifyingStart);
  
  return `
Hi ${username},

It's racing weekend! Do not forget your selections for this race.

Make sure you've chosen your:

Main driver, reserve driver and team.

Selections close 5 minutes before qualifying (or sprint qualifying on sprint weekends). Once the deadline passes, your lineup will be locked, and you won't be able to make changes.

Stay ahead of the competition—set your picks now and secure your points!

Login at thefantasyf1game.com

Good luck for the race weekend,
The Fantasy F1 Game Team

---

We know that no one likes spam, if you do not need this reminder you can opt out by simply logging in, go to your profile and opt out of the reminder.

Follow us on Instagram at @thefantasyf1game
  `;
}

// Check if there's a race tomorrow with qualifying
async function getTomorrowsRace() {
  const now = new Date();
  const tomorrow = addDays(now, 1);
  
  // Get all races that have qualifying tomorrow
  const races = await RaceCalendar.find({
    $or: [
      { qualifyingStart: { $gte: tomorrow, $lt: addDays(tomorrow, 1) } },
      { sprintQualifyingStart: { $gte: tomorrow, $lt: addDays(tomorrow, 1) } }
    ]
  });
  
  return races.length > 0 ? races[0] : null;
}

// Send reminder emails to all opted-in users
async function sendReminderEmails() {
  try {
    console.log('🔔 Starting reminder email process...');
    
    // Check if there's a race tomorrow
    const race = await getTomorrowsRace();
    if (!race) {
      console.log('📅 No race tomorrow, skipping reminders');
      return { sent: 0, skipped: 0 };
    }
    
    console.log(`🏁 Found race tomorrow: ${race.raceName} at ${race.circuit}`);
    
    // Get all users who want reminders
    const users = await User.find({ 
      emailRemindersEnabled: true 
    }).select('username email lastReminderSent');
    
    console.log(`👥 Found ${users.length} users opted in for reminders`);
    
    let sentCount = 0;
    let skippedCount = 0;
    
    // Send emails to each user
    for (const user of users) {
      try {
        // Check if we already sent a reminder for this race
        const today = new Date();
        const raceDate = new Date(race.qualifyingStart);
        
        // Skip if we already sent a reminder today
        if (user.lastReminderSent && isSameDay(user.lastReminderSent, today)) {
          console.log(`⏭️ Skipping ${user.username} - already sent reminder today`);
          skippedCount++;
          continue;
        }
        
        const subject = `${race.raceName} ${getCountryFlag(race.country)}`;
        const html = generateEmailHTML(user.username, race);
        const text = generateEmailText(user.username, race);
        
        await sendEmail({
          to: user.email,
          subject,
          html,
          text
        });
        
        // Update last reminder sent timestamp
        await User.findByIdAndUpdate(user._id, {
          lastReminderSent: new Date()
        });
        
        console.log(`✅ Sent reminder to ${user.username} (${user.email})`);
        sentCount++;
        
        // Add small delay to avoid overwhelming email service
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to send reminder to ${user.username}:`, error.message);
        skippedCount++;
      }
    }
    
    console.log(`📧 Reminder process complete: ${sentCount} sent, ${skippedCount} skipped`);
    return { sent: sentCount, skipped: skippedCount };
    
  } catch (error) {
    console.error('❌ Error in reminder email process:', error);
    throw error;
  }
}

// Generate simple test email template (matching working signup email style)
function generateTestEmailHTML(username) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
      <h2 style="color: #dc2626; text-align: center;">🧪 Test Email from TheFantasyF1Game</h2>
      <p>Hi <b>${username}</b>,</p>
      <p>This is a test email from TheFantasyF1Game reminder system!</p>
      <p>If you're receiving this email, it means the reminder system is working correctly.</p>
      <p>This is just a test - no action required!</p>
      <p style="margin-top:2em;">Visit <a href="https://thefantasyf1game.com" target="_blank">TheFantasyF1Game</a></p>
      <p>Follow us on Instagram → <a href="https://instagram.com/thefantasyf1game" target="_blank">@thefantasyf1game</a></p>
      <p><b>— TheFantasyF1Game Team</b></p>
    </div>
  `;
}

function generateTestEmailText(username) {
  return `
Hi ${username},

This is a test email from TheFantasyF1Game reminder system!

If you're receiving this email, it means the reminder system is working correctly.

Visit TheFantasyF1Game: https://thefantasyf1game.com

This is just a test - no action required!

---

Follow us on Instagram at @thefantasyf1game
  `;
}

// Send test reminder to a specific user (for testing purposes)
async function sendTestReminder(userId) {
  try {
    console.log(`🧪 Sending test reminder to user: ${userId}`);
    
    // Get the user
    const user = await User.findById(userId).select('username email emailRemindersEnabled');
    if (!user) {
      throw new Error('User not found');
    }
    
    console.log(`📧 Found user: ${user.username}`);
    
    // Use EXACT same content as working signup email to test if it's a content issue
    console.log(`📧 About to call sendEmail...`);
    
    await sendEmail({
      to: user.email, // Send to actual user email now that account is upgraded
      subject: '🏁 Test Reminder - TheFantasyF1Game',
      text: `Hi ${user.username},\n\nWelcome to TheFantasyF1Game — where Formula 1 passion meets strategy and competition.\nYou're officially on the grid, and it's time to prove your skills.\n\nEach race weekend, you'll choose your Main Driver, Reserve Driver, and Team. Will you play it safe or go bold for big points? The podium awaits.\n\n🔥 What's next?\n- Join or create a league with friends\n- Lock in your race selections before qualifying\n- Track your points and chase the title\n\n🏎️ For updates, tips, and behind-the-scenes action:\nFollow us on Instagram → @thefantasyf1game\n\nThanks for joining the race.\nStart your engines — the championship is calling. (click here to join)\n\n— TheFantasyF1Game Team`,
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
      <h2 style="color: #dc2626; text-align: center;">🏁 Welcome to TheFantasyF1Game — Your Race Starts Now!</h2>
      <p>Hi <b>${user.username}</b>,</p>
      <p>Welcome to <b>TheFantasyF1Game</b> — where Formula 1 passion meets strategy and competition.<br />You're officially on the grid, and it's time to prove your skills.</p>
      <p>Each race weekend, you'll choose your Main Driver, Reserve Driver, and Team. Will you play it safe or go bold for big points? The podium awaits.</p>
      <h3>🔥 What's next?</h3>
      <ul style="font-size: 1.1em;">
        <li>Join or create a league with friends</li>
        <li>Lock in your race selections before qualifying</li>
        <li>Track your points and chase the title</li>
      </ul>
      <p>🏎️ For updates, tips, and behind-the-scenes action:<br />
      Follow us on Instagram → <a href="https://instagram.com/thefantasyf1game" target="_blank">@thefantasyf1game</a></p>
      <p style="margin-top:2em;">Thanks for joining the race.<br />Start your engines — the championship is calling. <a href="https://thefantasyf1game.com" target="_blank">(click here to join)</a></p>
      <p><b>— TheFantasyF1Game Team</b></p>
    </div>
  `
    });
    
    console.log(`✅ Test reminder sent to ${user.username}`);
    return { success: true, user: user.username, email: user.email, race: 'Test Email' };
    
  } catch (error) {
    console.error('❌ Test reminder error:', error.message);
    throw error;
  }
}

module.exports = {
  sendReminderEmails,
  getTomorrowsRace,
  getCountryFlag,
  sendTestReminder
};
