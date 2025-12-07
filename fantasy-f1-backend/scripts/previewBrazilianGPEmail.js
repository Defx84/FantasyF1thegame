const mongoose = require('mongoose');
const RaceCalendar = require('../src/models/RaceCalendar');
const { generateEmailHTML, generateEmailText, getCountryFlag } = require('../src/services/reminderService');
require('dotenv').config();

async function previewEmail() {
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
    console.log(`   Circuit: ${race.circuit}`);
    console.log(`   Country: ${race.country}`);
    console.log(`   Is Sprint Weekend: ${race.isSprintWeekend}`);
    
    if (race.isSprintWeekend && race.sprintQualifyingStart) {
      const sprintQual = new Date(race.sprintQualifyingStart);
      console.log(`   Sprint Qualifying: ${sprintQual.toISOString()}`);
      console.log(`   Sprint Qualifying (UK): ${sprintQual.toLocaleString('en-GB', { timeZone: 'Europe/London', hour12: false })}`);
    }
    if (race.qualifyingStart) {
      const mainQual = new Date(race.qualifyingStart);
      console.log(`   Main Qualifying: ${mainQual.toISOString()}`);
      console.log(`   Main Qualifying (UK): ${mainQual.toLocaleString('en-GB', { timeZone: 'Europe/London', hour12: false })}`);
    }

    // Determine which qualifying time will be shown
    const qualifyingTime = race.isSprintWeekend && race.sprintQualifyingStart 
      ? new Date(race.sprintQualifyingStart) 
      : new Date(race.qualifyingStart);
    
    console.log(`\n📧 Email Details:`);
    console.log(`   Subject: "${race.raceName} ${getCountryFlag(race.country)}"`);
    console.log(`   Qualifying Time Shown: ${qualifyingTime.toISOString()}`);
    console.log(`   Qualifying Time Shown (UK): ${qualifyingTime.toLocaleString('en-GB', { timeZone: 'Europe/London', hour12: false })}`);
    console.log(`   ✅ Using Sprint Qualifying: ${race.isSprintWeekend && race.sprintQualifyingStart ? 'YES' : 'NO'}`);

    // Generate email content for a sample user
    const sampleUsername = 'TestUser';
    const html = generateEmailHTML(sampleUsername, race);
    const text = generateEmailText(sampleUsername, race);

    console.log('\n' + '='.repeat(70));
    console.log('📧 EMAIL PREVIEW');
    console.log('='.repeat(70));
    console.log(`\nSubject: ${race.raceName} ${getCountryFlag(race.country)}\n`);
    console.log('─'.repeat(70));
    console.log('TEXT VERSION:');
    console.log('─'.repeat(70));
    console.log(text);
    console.log('─'.repeat(70));
    console.log('\nHTML VERSION (first 1000 characters):');
    console.log('─'.repeat(70));
    console.log(html.substring(0, 1000));
    console.log('...\n[HTML continues with styling and formatting]');
    console.log('─'.repeat(70));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

previewEmail();








