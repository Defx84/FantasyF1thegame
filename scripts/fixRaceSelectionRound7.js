const mongoose = require('mongoose');
const path = require('path');

// Adjust these paths if your models are elsewhere
const RaceSelection = require(path.resolve(__dirname, '../fantasy-f1-backend/src/models/RaceSelection'));
const RaceResult = require(path.resolve(__dirname, '../fantasy-f1-backend/src/models/RaceResult'));

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://federicoruggiero84:B4FiS8NbWX1bCfxy@cluster0.sbs42.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function fixRound7Selections() {
  await mongoose.connect(MONGO_URI);

  // Find the correct RaceResult for round 7
  const raceResult = await RaceResult.findOne({ round: 7 });
  if (!raceResult) {
    console.error('No RaceResult found for round 7');
    process.exit(1);
  }

  // Update all RaceSelections for round 7 to reference the correct raceResult._id
  const result = await RaceSelection.updateMany(
    { round: 7 },
    { $set: { race: raceResult._id } }
  );

  console.log(`Updated ${result.nModified || result.modifiedCount} RaceSelections for round 7.`);
  await mongoose.disconnect();
}

fixRound7Selections().catch(err => {
  console.error(err);
  process.exit(1);
}); 