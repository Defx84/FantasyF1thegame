const mongoose = require('mongoose');
const RaceCalendar = require('../src/models/RaceCalendar');
const { getTomorrowsRace, generateEmailHTML, generateEmailText, getCountryFlag } = require('../src/services/reminderService');
require('dotenv').config();

async function checkWeekendEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const now = new Date();
    console.log('📅 Current Date/Time:', now.toISOString());
    console.log('📅 Current Date/Time (UK):', new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(), '\n');

    // Check what race would be found for tomorrow
    const tomorrowsRace = await getTomorrowsRace();
    
    if (!tomorrowsRace) {
      console.log('❌ No race found for tomorrow\n');
      
      // Find the next upcoming race
      const races = await RaceCalendar.find({
        $or: [
          { qualifyingStart: { $gte: now } },
          { sprintQualifyingStart: { $gte: now } }
        ]
      });
      
      // Sort manually to get the earliest qualifying time
      const nextRace = races.sort((a, b) => {
        const aTime = (a.isSprintWeekend && a.sprintQualifyingStart) 
          ? new Date(a.sprintQualifyingStart).getTime() 
          : new Date(a.qualifyingStart).getTime();
        const bTime = (b.isSprintWeekend && b.sprintQualifyingStart) 
          ? new Date(b.sprintQualifyingStart).getTime() 
          : new Date(b.qualifyingStart).getTime();
        return aTime - bTime;
      })[0];
      
      if (nextRace) {
        console.log('📊 Next Upcoming Race:');
        console.log(`   Race: ${nextRace.raceName}`);
        console.log(`   Round: ${nextRace.round}`);
        console.log(`   Circuit: ${nextRace.circuit}`);
        console.log(`   Country: ${nextRace.country}`);
        console.log(`   Is Sprint Weekend: ${nextRace.isSprintWeekend}`);
        
        if (nextRace.isSprintWeekend && nextRace.sprintQualifyingStart) {
          console.log(`   Sprint Qualifying: ${new Date(nextRace.sprintQualifyingStart).toISOString()}`);
        }
        if (nextRace.qualifyingStart) {
          console.log(`   Main Qualifying: ${new Date(nextRace.qualifyingStart).toISOString()}`);
        }
        if (nextRace.raceStart) {
          console.log(`   Race Start: ${new Date(nextRace.raceStart).toISOString()}`);
        }
        
        // Calculate when email would be sent
        const sprintQual = nextRace.isSprintWeekend && nextRace.sprintQualifyingStart 
          ? new Date(nextRace.sprintQualifyingStart) 
          : null;
        const mainQual = nextRace.qualifyingStart ? new Date(nextRace.qualifyingStart) : null;
        const qualTime = sprintQual || mainQual;
        
        if (qualTime) {
          const emailDate = new Date(qualTime);
          emailDate.setDate(emailDate.getDate() - 1);
          emailDate.setHours(19, 45, 0, 0); // 7:45 PM UK time
          
          console.log(`\n📧 Email would be sent on: ${emailDate.toISOString()}`);
          console.log(`   (${emailDate.toLocaleString('en-GB', { timeZone: 'Europe/London' })})`);
          
          // Determine which qualifying time will be shown
          const qualifyingTime = nextRace.isSprintWeekend && nextRace.sprintQualifyingStart 
            ? new Date(nextRace.sprintQualifyingStart) 
            : new Date(nextRace.qualifyingStart);
          
          console.log(`\n📧 Email Details:`);
          console.log(`   Subject: "${nextRace.raceName} ${getCountryFlag(nextRace.country)}"`);
          console.log(`   Qualifying Time Shown: ${qualifyingTime.toISOString()}`);
          console.log(`   Qualifying Time Shown (UK): ${new Date(qualifyingTime.getTime() + 1 * 60 * 60 * 1000).toISOString()}`);
          
          // Generate sample email content
          console.log('\n📝 Sample Email Content (for user "TestUser"):');
          console.log('─'.repeat(60));
          const html = generateEmailHTML('TestUser', nextRace);
          const text = generateEmailText('TestUser', nextRace);
          console.log('\nText Version:');
          console.log(text);
          console.log('─'.repeat(60));
        }
      } else {
        console.log('❌ No upcoming races found');
      }
    } else {
      console.log('✅ Race found for tomorrow!\n');
      console.log('📊 Race Details:');
      console.log(`   Race: ${tomorrowsRace.raceName}`);
      console.log(`   Round: ${tomorrowsRace.round}`);
      console.log(`   Circuit: ${tomorrowsRace.circuit}`);
      console.log(`   Country: ${tomorrowsRace.country}`);
      console.log(`   Is Sprint Weekend: ${tomorrowsRace.isSprintWeekend}`);
      
      if (tomorrowsRace.isSprintWeekend && tomorrowsRace.sprintQualifyingStart) {
        const sprintQual = new Date(tomorrowsRace.sprintQualifyingStart);
        console.log(`   Sprint Qualifying: ${sprintQual.toISOString()}`);
        console.log(`   Sprint Qualifying (UK): ${new Date(sprintQual.getTime() + 1 * 60 * 60 * 1000).toISOString()}`);
      }
      if (tomorrowsRace.qualifyingStart) {
        const mainQual = new Date(tomorrowsRace.qualifyingStart);
        console.log(`   Main Qualifying: ${mainQual.toISOString()}`);
        console.log(`   Main Qualifying (UK): ${new Date(mainQual.getTime() + 1 * 60 * 60 * 1000).toISOString()}`);
      }
      if (tomorrowsRace.raceStart) {
        const raceStart = new Date(tomorrowsRace.raceStart);
        console.log(`   Race Start: ${raceStart.toISOString()}`);
        console.log(`   Race Start (UK): ${new Date(raceStart.getTime() + 1 * 60 * 60 * 1000).toISOString()}`);
      }
      
      console.log('\n📧 Email Details:');
      console.log(`   Subject: "${tomorrowsRace.raceName} ${getCountryFlag(tomorrowsRace.country)}"`);
      
      // Determine which qualifying time will be shown
      const qualifyingTime = tomorrowsRace.isSprintWeekend && tomorrowsRace.sprintQualifyingStart 
        ? new Date(tomorrowsRace.sprintQualifyingStart) 
        : new Date(tomorrowsRace.qualifyingStart);
      
      console.log(`   Qualifying Time Shown: ${qualifyingTime.toISOString()}`);
      console.log(`   Qualifying Time Shown (UK): ${new Date(qualifyingTime.getTime() + 1 * 60 * 60 * 1000).toISOString()}`);
      
      // Generate sample email content
      console.log('\n📝 Sample Email Content (for user "TestUser"):');
      console.log('─'.repeat(60));
      const html = generateEmailHTML('TestUser', tomorrowsRace);
      const text = generateEmailText('TestUser', tomorrowsRace);
      console.log('\nHTML Preview (first 500 chars):');
      console.log(html.substring(0, 500) + '...');
      console.log('\nText Version:');
      console.log(text);
      console.log('─'.repeat(60));
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkWeekendEmail();

