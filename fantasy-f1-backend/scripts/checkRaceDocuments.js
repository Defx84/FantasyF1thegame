const mongoose = require('mongoose');
require('dotenv').config();

async function checkRaceDocuments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const RaceResult = require('../src/models/RaceResult');
    const raceResultCount = await RaceResult.countDocuments();

    console.log(`\nRaceResult documents count: ${raceResultCount}`);

    if (raceResultCount > 0) {
      console.log('\nFound RaceResult documents. Here are the details:');
      const races = await RaceResult.find({}).sort({ round: 1 });
      races.forEach(race => {
        console.log(`- Round ${race.round}: ${race.raceName} (${race.status})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkRaceDocuments(); 