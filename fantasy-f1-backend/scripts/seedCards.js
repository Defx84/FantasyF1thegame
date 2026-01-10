const mongoose = require('mongoose');
const Card = require('../src/models/Card');
require('dotenv').config();

// Card definitions
const DRIVER_CARDS = [
  {
    name: '2× Points',
    type: 'driver',
    tier: 'gold',
    slotCost: 3,
    effectType: 'multiply',
    effectValue: 2,
    description: 'Double your Main Driver\'s race points.',
    requiresTarget: null
  },
  {
    name: 'Mirror',
    type: 'driver',
    tier: 'gold',
    slotCost: 3,
    effectType: 'mirror',
    effectValue: null,
    description: 'Copy another player\'s entire weekend score.',
    requiresTarget: 'player'
  },
  {
    name: 'Switcheroo',
    type: 'driver',
    tier: 'gold',
    slotCost: 3,
    effectType: 'switcheroo',
    effectValue: null,
    description: 'Your Main Driver scores the race points of any driver you choose.',
    requiresTarget: 'driver'
  },
  {
    name: 'Teamwork',
    type: 'driver',
    tier: 'gold',
    slotCost: 3,
    effectType: 'teamwork2',
    effectValue: null,
    description: 'Score Main Driver points + teammate points.',
    requiresTarget: null
  },
  {
    name: 'Team Orders',
    type: 'driver',
    tier: 'silver',
    slotCost: 2,
    effectType: 'teamwork',
    effectValue: null,
    description: 'Score the teammate\'s race points instead of your Main Driver.',
    requiresTarget: null
  },
  {
    name: 'The lift',
    type: 'driver',
    tier: 'silver',
    slotCost: 2,
    effectType: 'position_adjust',
    effectValue: 1,
    description: 'Main Driver is classified one position higher.',
    requiresTarget: null
  },
  {
    name: 'Mystery Card',
    type: 'driver',
    tier: 'silver',
    slotCost: 2,
    effectType: 'mystery',
    effectValue: null,
    description: 'Becomes a random Driver card when activated.',
    requiresTarget: null
  },
  {
    name: 'Top 5 Boost',
    type: 'driver',
    tier: 'silver',
    slotCost: 2,
    effectType: 'conditional_bonus',
    effectValue: { condition: 'top5', bonus: 7 },
    description: 'If Main Driver finishes Top 5 → +7 points.',
    requiresTarget: null
  },
  {
    name: 'Top 10 Boost',
    type: 'driver',
    tier: 'bronze',
    slotCost: 1,
    effectType: 'conditional_bonus',
    effectValue: { condition: 'top10', bonus: 3 },
    description: 'If Main Driver finishes Top 10 → +3 points.',
    requiresTarget: null
  },
  {
    name: '+3 Points',
    type: 'driver',
    tier: 'bronze',
    slotCost: 1,
    effectType: 'flat_bonus',
    effectValue: 3,
    description: 'Gain a flat +3 points.',
    requiresTarget: null
  },
  {
    name: 'Competitiveness',
    type: 'driver',
    tier: 'bronze',
    slotCost: 1,
    effectType: 'conditional_bonus',
    effectValue: { condition: 'ahead_of_teammate', bonus: 2 },
    description: 'If Main Driver finishes ahead of teammate → +2 points.',
    requiresTarget: null
  },
  {
    name: 'Bottom 5',
    type: 'driver',
    tier: 'bronze',
    slotCost: 1,
    effectType: 'conditional_bonus',
    effectValue: { condition: 'bottom5', bonus: 2 },
    description: 'If Main Driver finishes bottom 5 → +2 points.',
    requiresTarget: null
  }
];

const TEAM_CARDS = [
  {
    name: 'Espionage',
    type: 'team',
    tier: 'gold',
    slotCost: 4,
    effectType: 'espionage',
    effectValue: null,
    description: 'Copy another team\'s total weekend points.',
    requiresTarget: 'team'
  },
  {
    name: 'Podium',
    type: 'team',
    tier: 'gold',
    slotCost: 4,
    effectType: 'podium',
    effectValue: { pointsPerPodium: 8, maxPoints: 16 },
    description: 'Gain +8 points for each podium car (max +16).',
    requiresTarget: null
  },
  {
    name: 'Top 5',
    type: 'team',
    tier: 'gold',
    slotCost: 4,
    effectType: 'conditional_bonus',
    effectValue: { condition: 'both_top5', bonus: 10 },
    description: 'If both cars finish Top 5 → +10 points.',
    requiresTarget: null
  },
  {
    name: 'Undercut',
    type: 'team',
    tier: 'silver',
    slotCost: 2,
    effectType: 'undercut',
    effectValue: -1,
    description: 'Second car is reclassified one position behind the better-placed teammate.',
    requiresTarget: null
  },
  {
    name: 'Top 10',
    type: 'team',
    tier: 'silver',
    slotCost: 2,
    effectType: 'conditional_bonus',
    effectValue: { condition: 'both_top10', bonus: 5 },
    description: 'If both cars finish Top 10 → +5 points.',
    requiresTarget: null
  },
  {
    name: 'Mystery Card',
    type: 'team',
    tier: 'silver',
    slotCost: 2,
    effectType: 'random',
    effectValue: null,
    description: 'Becomes a random Team card when activated.',
    requiresTarget: null
  },
  {
    name: 'Sponsors',
    type: 'team',
    tier: 'bronze',
    slotCost: 1,
    effectType: 'conditional_bonus',
    effectValue: { condition: 'sponsors', bonus: { zero: 5, one: 1 } },
    description: 'If team scores 0 → +5 points; if team scores 1 → +1 point.',
    requiresTarget: null
  },
  {
    name: 'Bottom 5',
    type: 'team',
    tier: 'bronze',
    slotCost: 1,
    effectType: 'conditional_bonus',
    effectValue: { condition: 'both_bottom5', bonus: 3 },
    description: 'If both cars finish in the bottom 5 → +3 points.',
    requiresTarget: null
  },
  {
    name: 'Last Place Bonus',
    type: 'team',
    tier: 'bronze',
    slotCost: 1,
    effectType: 'conditional_bonus',
    effectValue: { condition: 'one_last_place', bonus: 3 },
    description: 'If one classified car finishes last → +3 points.',
    requiresTarget: null
  }
];

async function seedCards() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing cards (optional - comment out if you want to keep existing)
    // await Card.deleteMany({});
    // console.log('🗑️  Cleared existing cards');

    // Insert/Update Driver Cards
    console.log('\n📦 Seeding Driver Cards...');
    
    // Map of old names to new names for migration
    const nameMigrations = {
      'Teamwork 2': 'Teamwork',  // Gold card
      'Teamwork': 'Team Orders',  // Silver card (update this first!)
      'Move Up 1 Rank': 'The lift'
    };
    
    for (const cardData of DRIVER_CARDS) {
      // First, try to find by effectType (most reliable)
      let existingCard = await Card.findOne({ effectType: cardData.effectType, type: 'driver' });
      
      // If not found, check for old name (for migration)
      if (!existingCard) {
        const oldName = Object.keys(nameMigrations).find(old => nameMigrations[old] === cardData.name);
        if (oldName) {
          existingCard = await Card.findOne({ name: oldName, type: 'driver' });
        }
      }
      
      if (existingCard) {
        // Check if name is changing and if new name already exists for this type
        if (existingCard.name !== cardData.name) {
          const nameConflict = await Card.findOne({ name: cardData.name, type: cardData.type });
          if (nameConflict && nameConflict._id.toString() !== existingCard._id.toString()) {
            // Check if it's the same effectType (shouldn't happen, but handle it)
            if (nameConflict.effectType === cardData.effectType) {
              // Same card, just delete the duplicate
              await Card.deleteOne({ _id: nameConflict._id });
              console.log(`   🗑️  Deleted duplicate card: ${nameConflict.name}`);
            } else {
              // Different card with same name - this shouldn't happen with unique index
              console.warn(`   ⚠️  Name conflict: ${cardData.name} exists with different effectType`);
            }
          }
        }
        
        // Update existing card with new data
        Object.assign(existingCard, cardData);
        await existingCard.save();
        console.log(`   ✅ Updated ${existingCard.name} → ${cardData.name} (${cardData.tier}, ${cardData.slotCost} slots)`);
      } else {
        // Check if card with new name already exists
        const nameExists = await Card.findOne({ name: cardData.name, type: 'driver' });
        if (nameExists) {
          // Update existing card
          Object.assign(nameExists, cardData);
          await nameExists.save();
          console.log(`   ✅ Updated ${cardData.name} (${cardData.tier}, ${cardData.slotCost} slots)`);
        } else {
          // Create new card
          const card = new Card(cardData);
          await card.save();
          console.log(`   ✅ Created ${cardData.name} (${cardData.tier}, ${cardData.slotCost} slots)`);
        }
      }
    }

    // Insert/Update Team Cards
    console.log('\n📦 Seeding Team Cards...');
    for (const cardData of TEAM_CARDS) {
      // First, try to find by effectType (most reliable)
      let existingCard = await Card.findOne({ effectType: cardData.effectType, type: 'team' });
      
      if (existingCard) {
        // Check if name is changing
        if (existingCard.name !== cardData.name) {
          const nameConflict = await Card.findOne({ name: cardData.name, type: cardData.type });
          if (nameConflict && nameConflict._id.toString() !== existingCard._id.toString()) {
            // If the conflicting card has the same effectType, it's a true duplicate - delete it
            if (nameConflict.effectType === cardData.effectType) {
              await Card.deleteOne({ _id: nameConflict._id });
              console.log(`   🗑️  Deleted duplicate card: ${nameConflict.name}`);
            } else {
              // Different effectType - this is a name collision from renaming
              console.warn(`   ⚠️  Name conflict: ${cardData.name} exists with different effectType (${nameConflict.effectType} vs ${cardData.effectType})`);
              console.warn(`   ⏭️  Skipping update for ${cardData.name} - please resolve conflict manually`);
              continue; // Skip this card
            }
          }
        }
        
        // Update existing card with new data
        Object.assign(existingCard, cardData);
        await existingCard.save();
        console.log(`   ✅ Updated ${existingCard.name} → ${cardData.name} (${cardData.tier}, ${cardData.slotCost} slots)`);
      } else {
        // Check if card with new name already exists
        const nameExists = await Card.findOne({ name: cardData.name, type: 'team' });
        if (nameExists) {
          // If it has the same effectType, update it; otherwise skip
          if (nameExists.effectType === cardData.effectType) {
            Object.assign(nameExists, cardData);
            await nameExists.save();
            console.log(`   ✅ Updated ${cardData.name} (${cardData.tier}, ${cardData.slotCost} slots)`);
          } else {
            console.warn(`   ⚠️  Card ${cardData.name} exists with different effectType, skipping`);
            continue;
          }
        } else {
          // Create new card
          const card = new Card(cardData);
          await card.save();
          console.log(`   ✅ Created ${cardData.name} (${cardData.tier}, ${cardData.slotCost} slots)`);
        }
      }
    }

    // Summary
    const driverCount = await Card.countDocuments({ type: 'driver' });
    const teamCount = await Card.countDocuments({ type: 'team' });
    console.log(`\n📊 Summary:`);
    console.log(`   Driver Cards: ${driverCount}`);
    console.log(`   Team Cards: ${teamCount}`);
    console.log(`   Total Cards: ${driverCount + teamCount}`);

    console.log('\n✅ Card seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding cards:', error);
    process.exit(1);
  }
}

// Run the seed function
seedCards();

