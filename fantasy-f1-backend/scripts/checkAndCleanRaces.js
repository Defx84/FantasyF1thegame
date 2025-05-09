const mongoose = require('mongoose');
require('dotenv').config();

async function checkAndCleanRaces() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Try to get the Race model if it exists
    let Race;
    try {
      Race = mongoose.model('Race');
      console.log('Race model found');
    } catch (e) {
      console.log('Race model not found - no cleanup needed');
      process.exit(0);
    }

    // If we get here, the Race model exists
    const races = await Race.find({});
    console.log(`Found ${races.length} Race documents`);

    if (races.length > 0) {
      // Delete all Race documents
      await Race.deleteMany({});
      console.log('Deleted all Race documents');

      // Delete the Race model from Mongoose
      delete mongoose.models['Race'];
      delete mongoose.modelSchemas['Race'];
      console.log('Removed Race model from Mongoose');
    }

    console.log('Cleanup complete');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndCleanRaces(); 