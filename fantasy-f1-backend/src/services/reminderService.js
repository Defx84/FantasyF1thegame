const { sendEmail } = require('../utils/email');
const User = require('../models/User');
const RaceCalendar = require('../models/RaceCalendar');
const { format, addDays, isSameDay } = require('date-fns');
const { formatInTimeZone } = require('date-fns-tz');

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

// Format time for UK timezone (handles GMT/BST automatically)
function formatUKTime(date) {
  return formatInTimeZone(date, 'Europe/London', "EEEE, MMMM do 'at' HH:mm");
}

// Generate email HTML template
function generateEmailHTML(username, race) {
  const countryFlag = getCountryFlag(race.country);
  // Use sprint qualifying time for sprint weekends, otherwise use regular qualifying
  const qualifyingTime = formatUKTime(
    race.isSprintWeekend && race.sprintQualifyingStart 
      ? race.sprintQualifyingStart 
      : race.qualifyingStart
  );
  
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
      
      <p style="font-size: 16px; line-height: 1.6;">Selections close 5 minutes before ${race.isSprintWeekend ? 'sprint qualifying' : 'qualifying'}, which is scheduled for <strong>${qualifyingTime}</strong>. Once the deadline passes, your lineup will be locked, and you won't be able to make changes.</p>
      
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
  // Use sprint qualifying time for sprint weekends, otherwise use regular qualifying
  const qualifyingTime = formatUKTime(
    race.isSprintWeekend && race.sprintQualifyingStart 
      ? race.sprintQualifyingStart 
      : race.qualifyingStart
  );
  
  return `
Hi ${username},

It's racing weekend! Do not forget your selections for this race.

Make sure you've chosen your:

Main driver, reserve driver and team.

Selections close 5 minutes before ${race.isSprintWeekend ? 'sprint qualifying' : 'qualifying'}, which is scheduled for ${qualifyingTime}. Once the deadline passes, your lineup will be locked, and you won't be able to make changes.

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
  
  // Get start of tomorrow (00:00:00) instead of current time + 24 hours
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const dayAfterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  
  // Get all races that have qualifying tomorrow
  const races = await RaceCalendar.find({
    $or: [
      { qualifyingStart: { $gte: tomorrow, $lt: dayAfterTomorrow } },
      { sprintQualifyingStart: { $gte: tomorrow, $lt: dayAfterTomorrow } }
    ]
  });
  
  return races.length > 0 ? races[0] : null;
}

// Get the next available race (for testing purposes)
async function getNextRace() {
  const now = new Date();
  
  const race = await RaceCalendar.findOne({
    $or: [
      { qualifyingStart: { $gte: now } },
      { sprintQualifyingStart: { $gte: now } }
    ]
  }).sort({ qualifyingStart: 1 }); // Get the earliest upcoming race
  
  return race;
}

// Test seasons (e.g. 3026): do not send reminder emails to avoid spamming during tests
const REMINDER_TEST_SEASON_MIN = 3000; // seasons >= this are considered test (e.g. 3026)

// Send reminder emails to all opted-in users
async function sendReminderEmails() {
  try {
    console.log('🔔 Starting reminder email process...');

    if (process.env.SKIP_REMINDER_EMAILS === 'true' || process.env.SKIP_REMINDER_EMAILS === '1') {
      console.log('📧 Reminders disabled (SKIP_REMINDER_EMAILS), skipping');
      return { sent: 0, skipped: 0 };
    }
    
    // Check if there's a race tomorrow
    const race = await getTomorrowsRace();
    if (!race) {
      console.log('📅 No race tomorrow, skipping reminders');
      return { sent: 0, skipped: 0 };
    }

    const season = race.season != null ? Number(race.season) : null;
    if (season !== null && season >= REMINDER_TEST_SEASON_MIN) {
      console.log(`📧 Test season ${season}, skipping reminder emails`);
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
    
    // Get the next available race for testing
    const race = await getNextRace();
    if (!race) {
      throw new Error('No upcoming race found for testing');
    }
    
    console.log(`🏁 Using race for test: ${race.raceName} at ${race.circuit}`);
    
    // Use the actual race reminder template
    const subject = `${race.raceName} ${getCountryFlag(race.country)}`;
    const html = generateEmailHTML(user.username, race);
    const text = generateEmailText(user.username, race);
    
    await sendEmail({
      to: user.email,
      subject: `[TEST] ${subject}`,
      html: html,
      text: text
    });
    
    console.log(`✅ Test reminder sent to ${user.username} for ${race.raceName}`);
    return { 
      success: true, 
      user: user.username, 
      email: user.email, 
      race: race.raceName,
      circuit: race.circuit,
      country: race.country
    };
    
  } catch (error) {
    console.error('❌ Test reminder error:', error.message);
    throw error;
  }
}

// Send reminder for a specific race (by round number)
async function sendRaceReminderByRound(round) {
  try {
    console.log(`🔔 Starting reminder email process for round ${round}...`);

    if (process.env.SKIP_REMINDER_EMAILS === 'true' || process.env.SKIP_REMINDER_EMAILS === '1') {
      console.log('📧 Reminders disabled (SKIP_REMINDER_EMAILS), skipping');
      return { sent: 0, skipped: 0 };
    }
    
    // Find the race by round
    const race = await RaceCalendar.findOne({ round });
    if (!race) {
      throw new Error(`Race with round ${round} not found`);
    }

    const season = race.season != null ? Number(race.season) : null;
    if (season !== null && season >= REMINDER_TEST_SEASON_MIN) {
      console.log(`📧 Test season ${season}, skipping reminder emails`);
      return { sent: 0, skipped: 0 };
    }
    
    console.log(`🏁 Found race: ${race.raceName} at ${race.circuit}`);
    
    // Get all users who want reminders
    const users = await User.find({ 
      emailRemindersEnabled: true 
    }).select('username email lastReminderSent');
    
    console.log(`👥 Found ${users.length} users opted in for reminders`);
    
    let sentCount = 0;
    let skippedCount = 0;
    
    // Send emails to each user (bypass the "already sent today" check for manual sends)
    for (const user of users) {
      try {
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
    console.error('❌ Error in race reminder process:', error);
    throw error;
  }
}

// Prizes announcement (one-off campaign: TheFantasyLeague2026 - Winning prizes)
const PRIZES_ANNOUNCEMENT_SUBJECT = 'TheFantasyLeague2026 - Winning prizes';

function generatePrizesAnnouncementHTML() {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
      <!-- Banner (same as weekly reminder) -->
      <img src="https://thefantasyf1game.com/email-banner.png" 
           alt="TheFantasyF1Game" 
           style="max-width: 100%; height: auto; display: block; margin: 0 auto 20px; border-radius: 8px;">
      <!-- Content -->
      <h2 style="color: #dc2626; text-align: center;">Hello everyone,</h2>
      <p style="font-size: 16px; line-height: 1.6;">I am excited to announce that the <strong>Open League - TheFantasyLeague2026</strong>, will now have official prizes for this season.</p>
      <p style="font-size: 16px; line-height: 1.6;">At the end of the championship:</p>
      <ul style="font-size: 16px; line-height: 1.8;">
        <li>The winner of the <strong>Driver's Championship</strong> will receive an official and personalized theFantasyF1game T-shirt.</li>
        <li>The winner of the <strong>Team Championship</strong> will receive an official and personalized theFantasyF1game T-shirt.</li>
      </ul>
      <p style="font-size: 16px; line-height: 1.6;">There is now less than one week before the 2026 season begins, so this is the perfect time to secure your spot.</p>
      <p style="font-size: 16px; line-height: 1.6;">If you would like to join the public league and compete for the prizes, use the code below inside the app:</p>
      <p style="font-size: 1.2em; font-weight: bold; letter-spacing: 0.1em; color: #dc2626; text-align: center;">O50NQV</p>
      <p style="font-size: 16px; line-height: 1.6;">This is our way of rewarding the most consistent and strategic players in the league. With the start approaching, every race weekend will matter from the very first lights out.</p>
      <p style="font-size: 16px; line-height: 1.6;">If you're already competing, it's time to prepare.<br>If you haven't joined yet, now is the moment.</p>
      <p style="font-size: 16px; line-height: 1.6;">Good luck to everyone — and may the best strategist win.</p>
      <p style="font-size: 16px; line-height: 1.6;"><strong>Federico</strong><br>Founder, theFantasyF1game</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="font-size: 14px; color: #666;">Follow us on Instagram at <a href="https://instagram.com/thefantasyf1game" style="color: #dc2626;">@thefantasyf1game</a></p>
    </div>
  `;
}

function generatePrizesAnnouncementText() {
  return `Hello everyone,

I am excited to announce that the Open League - TheFantasyLeague2026, will now have official prizes for this season.

At the end of the championship:

• The winner of the Driver's Championship will receive an official and personalized theFantasyF1game T-shirt.
• The winner of the Team Championship will receive an official and personalized theFantasyF1game T-shirt.

There is now less than one week before the 2026 season begins, so this is the perfect time to secure your spot.

If you would like to join the public league and compete for the prizes, use the code below inside the app: O50NQV

This is our way of rewarding the most consistent and strategic players in the league. With the start approaching, every race weekend will matter from the very first lights out.

If you're already competing, it's time to prepare.
If you haven't joined yet, now is the moment.

Good luck to everyone — and may the best strategist win.

Federico
Founder, theFantasyF1game`;
}

/**
 * Send prizes announcement email to all users with an email address.
 * Used by cron on Sunday 1 March 2026 at 10:00 UK time.
 */
async function sendPrizesAnnouncementEmails() {
  try {
    console.log('📧 Starting prizes announcement email process...');

    const users = await User.find({})
      .select('email username')
      .sort({ username: 1 })
      .lean();

    const withEmail = users.filter((u) => u.email && String(u.email).trim());
    console.log(`👥 Found ${withEmail.length} users with email (total users: ${users.length})`);

    const html = generatePrizesAnnouncementHTML();
    const text = generatePrizesAnnouncementText();
    let sent = 0;
    let failed = 0;

    for (const user of withEmail) {
      try {
        await sendEmail({
          to: user.email.trim(),
          subject: PRIZES_ANNOUNCEMENT_SUBJECT,
          html,
          text
        });
        sent++;
        console.log(`✅ Sent to ${user.username} (${user.email})`);
        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        failed++;
        console.error(`❌ Failed to send to ${user.email}:`, err.message);
      }
    }

    console.log(`📧 Prizes announcement complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  } catch (error) {
    console.error('❌ Error in prizes announcement process:', error);
    throw error;
  }
}

module.exports = {
  sendReminderEmails,
  getTomorrowsRace,
  getNextRace,
  getCountryFlag,
  sendTestReminder,
  generateEmailHTML,
  generateEmailText,
  sendRaceReminderByRound,
  sendPrizesAnnouncementEmails
};
