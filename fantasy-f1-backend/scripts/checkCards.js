const mongoose = require('mongoose');
const Card = require('../src/models/Card');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const driverCards = await Card.find({ type: 'driver' }).sort({ tier: 1, name: 1 });
    const teamCards = await Card.find({ type: 'team' }).sort({ tier: 1, name: 1 });

    console.log('=== DRIVER CARDS ===');
    driverCards.forEach(c => {
      console.log(`  ${c.tier.padEnd(6)} ${c.name.padEnd(20)} (${c.slotCost} slots)`);
    });
    console.log(`\nTotal: ${driverCards.length} driver cards`);

    console.log('\n=== TEAM CARDS ===');
    teamCards.forEach(c => {
      console.log(`  ${c.tier.padEnd(6)} ${c.name.padEnd(20)} (${c.slotCost} slots)`);
    });
    console.log(`\nTotal: ${teamCards.length} team cards`);

    console.log(`\n✅ Expected: 12 driver cards, 9 team cards`);
    console.log(`   Actual: ${driverCards.length} driver cards, ${teamCards.length} team cards`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();


