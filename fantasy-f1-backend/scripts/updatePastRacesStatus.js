const mongoose = require('mongoose');
require('dotenv').config();

async function updatePastRaces() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const RaceResult = require('../src/models/RaceResult');
    const now = new Date();

    const result = await RaceResult.updateMany(
      { raceStart: { $lt: now } }, // Race started in the past
      { $set: { status: 'completed' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} races to completed status.`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updatePastRaces(); 