const mongoose = require('mongoose');
const RaceCalendar = require('../src/models/RaceCalendar');
const User = require('../src/models/User');
const { sendEmail } = require('../src/utils/email');
const { generateEmailHTML, generateEmailText, getCountryFlag } = require('../src/services/reminderService');
require('dotenv').config();

async function sendBrazilianGPReminder() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Brazilian GP (Round 21)
    const race = await RaceCalendar.findOne({ round: 21 });
    
    if (!race) {
      console.error('❌ Brazilian GP not found in database');
      process.exit(1);
    }

    console.log('📊 Race Details:');
    console.log(`   Race: ${race.raceName}`);
    console.log(`   Round: ${race.round}`);
    console.log(`   Is Sprint Weekend: ${race.isSprintWeekend}`);
    
    if (race.isSprintWeekend && race.sprintQualifyingStart) {
      const sprintQual = new Date(race.sprintQualifyingStart);
      console.log(`   Sprint Qualifying: ${sprintQual.toISOString()}`);
      console.log(`   Sprint Qualifying (UK): ${sprintQual.toLocaleString('en-GB', { timeZone: 'Europe/London' })}`);
    }

    // Get all users who want reminders
    const users = await User.find({ 
      emailRemindersEnabled: true 
    }).select('username email lastReminderSent');

    console.log(`\n👥 Found ${users.length} users opted in for reminders\n`);

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Send emails to each user
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
        errorCount++;
      }
    }

    console.log(`\n📧 Reminder process complete:`);
    console.log(`   ✅ Sent: ${sentCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

sendBrazilianGPReminder();








