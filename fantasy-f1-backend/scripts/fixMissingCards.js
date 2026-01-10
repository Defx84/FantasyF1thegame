const mongoose = require('mongoose');
const Card = require('../src/models/Card');
require('dotenv').config();

const missingCards = [
  { name: 'Top 5 Boost', type: 'driver', tier: 'silver', slotCost: 2, effectType: 'conditional_bonus', effectValue: { condition: 'top5', bonus: 7 }, description: 'If Main Driver finishes Top 5 → +7 points.', requiresTarget: null },
  { name: 'Top 10 Boost', type: 'driver', tier: 'bronze', slotCost: 1, effectType: 'conditional_bonus', effectValue: { condition: 'top10', bonus: 3 }, description: 'If Main Driver finishes Top 10 → +3 points.', requiresTarget: null },
  { name: 'Competitiveness', type: 'driver', tier: 'bronze', slotCost: 1, effectType: 'conditional_bonus', effectValue: { condition: 'ahead_of_teammate', bonus: 2 }, description: 'If Main Driver finishes ahead of teammate → +2 points.', requiresTarget: null },
  { name: 'Top 5', type: 'team', tier: 'gold', slotCost: 4, effectType: 'conditional_bonus', effectValue: { condition: 'both_top5', bonus: 10 }, description: 'If both cars finish Top 5 → +10 points.', requiresTarget: null },
  { name: 'Top 10', type: 'team', tier: 'silver', slotCost: 2, effectType: 'conditional_bonus', effectValue: { condition: 'both_top10', bonus: 5 }, description: 'If both cars finish Top 10 → +5 points.', requiresTarget: null },
  { name: 'Sponsors', type: 'team', tier: 'bronze', slotCost: 1, effectType: 'conditional_bonus', effectValue: { condition: 'sponsors', bonus: { zero: 5, one: 1 } }, description: 'If team scores 0 → +5 points; if team scores 1 → +1 point.', requiresTarget: null },
  { name: 'Bottom 5', type: 'team', tier: 'bronze', slotCost: 1, effectType: 'conditional_bonus', effectValue: { condition: 'both_bottom5', bonus: 3 }, description: 'If both cars finish in the bottom 5 → +3 points.', requiresTarget: null },
  { name: 'Sponsors', type: 'team', tier: 'bronze', slotCost: 1, effectType: 'conditional_bonus', effectValue: { condition: 'sponsors', bonus: { zero: 5, one: 1 } }, description: 'If team scores 0 → +5 points; if team scores 1 → +1 point.', requiresTarget: null }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    for (const cardData of missingCards) {
      const existing = await Card.findOne({ name: cardData.name, type: cardData.type });
      if (existing) {
        console.log(`⏭️  ${cardData.name} already exists`);
      } else {
        // Check if there's a card with same name but different type (shouldn't happen but check)
        const nameConflict = await Card.findOne({ name: cardData.name });
        if (nameConflict) {
          console.log(`⚠️  Name conflict: ${cardData.name} exists as ${nameConflict.type}, deleting...`);
          await Card.deleteOne({ _id: nameConflict._id });
        }
        const card = new Card(cardData);
        await card.save();
        console.log(`✅ Created ${cardData.name} (${cardData.type}, ${cardData.tier})`);
      }
    }

    const driverCount = await Card.countDocuments({ type: 'driver' });
    const teamCount = await Card.countDocuments({ type: 'team' });
    console.log(`\n📊 Final count: ${driverCount} driver cards, ${teamCount} team cards`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();

