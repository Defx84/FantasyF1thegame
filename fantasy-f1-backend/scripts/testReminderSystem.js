require('dotenv').config();
const mongoose = require('mongoose');
const { sendReminderEmails, getTomorrowsRace } = require('../src/services/reminderService');

async function testReminderSystem() {
  try {
    console.log('🧪 Testing reminder system...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');
    
    // Test getting tomorrow's race
    console.log('\n🔍 Checking for tomorrow\'s race...');
    const race = await getTomorrowsRace();
    
    if (race) {
      console.log(`✅ Found race tomorrow: ${race.raceName} at ${race.circuit}`);
      console.log(`   Qualifying: ${race.qualifyingStart}`);
      if (race.isSprintWeekend) {
        console.log(`   Sprint Qualifying: ${race.sprintQualifyingStart}`);
      }
    } else {
      console.log('❌ No race found for tomorrow');
    }
    
    // Test sending reminder emails (dry run - comment out actual sending)
    console.log('\n📧 Testing reminder email sending...');
    console.log('⚠️  This is a DRY RUN - no emails will be sent');
    
    // Uncomment the line below to actually send emails (be careful!)
    // const result = await sendReminderEmails();
    // console.log(`📧 Result: ${result.sent} sent, ${result.skipped} skipped`);
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
}

// Run the test
testReminderSystem();
