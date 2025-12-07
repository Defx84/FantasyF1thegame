const mongoose = require('mongoose');
const RaceCalendar = require('../src/models/RaceCalendar');
const { generateEmailHTML, generateEmailText, getCountryFlag } = require('../src/services/reminderService');
require('dotenv').config();

async function checkSprintWeekends() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const now = new Date();
    console.log('📅 Current Date/Time:', now.toISOString(), '\n');

    // Find all upcoming sprint weekends
    const sprintWeekends = await RaceCalendar.find({
      isSprintWeekend: true,
      $or: [
        { qualifyingStart: { $gte: now } },
        { sprintQualifyingStart: { $gte: now } }
      ]
    }).sort({ sprintQualifyingStart: 1 });

    if (sprintWeekends.length === 0) {
      console.log('❌ No upcoming sprint weekends found\n');
    } else {
      console.log(`✅ Found ${sprintWeekends.length} upcoming sprint weekend(s):\n`);
      
      sprintWeekends.forEach((race, index) => {
        console.log(`${index + 1}. ${race.raceName} (Round ${race.round})`);
        console.log(`   Circuit: ${race.circuit}`);
        console.log(`   Country: ${race.country}`);
        
        if (race.sprintQualifyingStart) {
          const sprintQual = new Date(race.sprintQualifyingStart);
          console.log(`   Sprint Qualifying: ${sprintQual.toISOString()}`);
          console.log(`   Sprint Qualifying (UK): ${new Date(sprintQual.getTime() + 1 * 60 * 60 * 1000).toISOString()}`);
        }
        if (race.qualifyingStart) {
          const mainQual = new Date(race.qualifyingStart);
          console.log(`   Main Qualifying: ${mainQual.toISOString()}`);
          console.log(`   Main Qualifying (UK): ${new Date(mainQual.getTime() + 1 * 60 * 60 * 1000).toISOString()}`);
        }
        if (race.raceStart) {
          const raceStart = new Date(race.raceStart);
          console.log(`   Race Start: ${raceStart.toISOString()}`);
          console.log(`   Race Start (UK): ${new Date(raceStart.getTime() + 1 * 60 * 60 * 1000).toISOString()}`);
        }
        
        // Calculate when email would be sent
        if (race.sprintQualifyingStart) {
          const qualTime = new Date(race.sprintQualifyingStart);
          const emailDate = new Date(qualTime);
          emailDate.setDate(emailDate.getDate() - 1);
          emailDate.setHours(19, 45, 0, 0); // 7:45 PM UK time
          
          console.log(`\n   📧 Email would be sent on: ${emailDate.toISOString()}`);
          console.log(`      (${emailDate.toLocaleString('en-GB', { timeZone: 'Europe/London' })})`);
          
          // Determine which qualifying time will be shown (should be sprint qualifying)
          const qualifyingTime = race.isSprintWeekend && race.sprintQualifyingStart 
            ? new Date(race.sprintQualifyingStart) 
            : new Date(race.qualifyingStart);
          
          console.log(`   📧 Email Details:`);
          console.log(`      Subject: "${race.raceName} ${getCountryFlag(race.country)}"`);
          console.log(`      Qualifying Time Shown: ${qualifyingTime.toISOString()}`);
          console.log(`      Qualifying Time Shown (UK): ${new Date(qualifyingTime.getTime() + 1 * 60 * 60 * 1000).toISOString()}`);
          console.log(`      ✅ Using Sprint Qualifying Time: ${race.isSprintWeekend && race.sprintQualifyingStart ? 'YES' : 'NO'}`);
        }
        
        console.log('\n   📝 Sample Email Content:');
        console.log('   ' + '─'.repeat(58));
        const text = generateEmailText('TestUser', race);
        const lines = text.split('\n');
        lines.forEach(line => {
          console.log('   ' + line);
        });
        console.log('   ' + '─'.repeat(58));
        console.log('');
      });
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSprintWeekends();








