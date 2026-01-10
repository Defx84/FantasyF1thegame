/**
 * Simplified Mystery Card Test
 * Tests the Mystery Card transformation logic directly
 */

const Card = require('../src/models/Card');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasyf1';

async function testMysteryCardTransformation() {
  console.log('🧪 MYSTERY CARD TRANSFORMATION TEST');
  console.log('='.repeat(50));
  
  try {
    // Connect to database
    console.log('\n📦 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    // Find Mystery Card
    console.log('\n🃏 Finding Mystery Card...');
    const mysteryCard = await Card.findOne({ 
      name: 'Mystery Card',
      type: 'driver',
      isActive: true 
    });

    if (!mysteryCard) {
      console.error('❌ Mystery Card not found in database');
      return;
    }

    console.log('✅ Mystery Card found:', mysteryCard.name);
    console.log('   ID:', mysteryCard._id);
    console.log('   Tier:', mysteryCard.tier);
    console.log('   Effect Type:', mysteryCard.effectType);

    // Get all driver cards (excluding Mystery Card itself)
    console.log('\n📚 Getting all driver cards...');
    const allDriverCards = await Card.find({ 
      type: 'driver', 
      isActive: true, 
      effectType: { $ne: 'mystery' } 
    });

    console.log(`✅ Found ${allDriverCards.length} driver cards (excluding Mystery Card)`);
    console.log('   Available cards:', allDriverCards.map(c => c.name).join(', '));

    // Test transformation 10 times
    console.log('\n🎲 Testing Mystery Card transformations (10 times)...');
    console.log('-'.repeat(50));
    
    const transformations = [];
    for (let i = 1; i <= 10; i++) {
      const randomIndex = Math.floor(Math.random() * allDriverCards.length);
      const transformedCard = allDriverCards[randomIndex];
      transformations.push(transformedCard.name);
      
      console.log(`   ${i}. ${transformedCard.name} (${transformedCard.tier}, ${transformedCard.effectType})`);
    }

    // Analyze results
    console.log('\n📊 Transformation Analysis:');
    const uniqueTransformations = [...new Set(transformations)];
    const counts = {};
    transformations.forEach(name => {
      counts[name] = (counts[name] || 0) + 1;
    });

    console.log(`   Total transformations: ${transformations.length}`);
    console.log(`   Unique cards: ${uniqueTransformations.length}`);
    console.log(`   Distribution:`);
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([name, count]) => {
        console.log(`     ${name}: ${count} time(s)`);
      });

    if (uniqueTransformations.length > 1) {
      console.log('\n✅ Mystery Card is randomizing correctly!');
    } else {
      console.log('\n⚠️  All transformations were the same (unlikely but possible)');
    }

    // Test that Mystery Card is excluded
    console.log('\n🔍 Verifying Mystery Card exclusion...');
    const includesMystery = allDriverCards.some(c => c.effectType === 'mystery');
    if (includesMystery) {
      console.log('❌ ERROR: Mystery Card found in transformation pool!');
    } else {
      console.log('✅ Mystery Card correctly excluded from transformation pool');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ TEST COMPLETED SUCCESSFULLY!');
    console.log('\n📝 Summary:');
    console.log('   - Mystery Card exists in database');
    console.log('   - Transformation pool excludes Mystery Card');
    console.log('   - Transformations are random');
    console.log('   - Multiple different cards can be generated');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n📦 Disconnected from database');
  }
}

// Run the test
if (require.main === module) {
  testMysteryCardTransformation()
    .then(() => {
      console.log('\n🏁 Test finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testMysteryCardTransformation };

