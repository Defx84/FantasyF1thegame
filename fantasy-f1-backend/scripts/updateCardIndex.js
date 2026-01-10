const mongoose = require('mongoose');
const Card = require('../src/models/Card');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Drop the old unique index on name only
    try {
      await Card.collection.dropIndex('name_1');
      console.log('✅ Dropped old unique index on name');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Old index does not exist, skipping');
      } else {
        console.log('⚠️  Could not drop old index:', error.message);
      }
    }

    // Create new compound unique index on name + type
    try {
      await Card.collection.createIndex({ name: 1, type: 1 }, { unique: true });
      console.log('✅ Created compound unique index on (name, type)');
    } catch (error) {
      console.log('⚠️  Index may already exist:', error.message);
    }

    await mongoose.disconnect();
    console.log('\n✅ Index update completed!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();


