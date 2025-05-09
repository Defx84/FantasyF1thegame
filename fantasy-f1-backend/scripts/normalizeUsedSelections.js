// Script to normalize all used driver and team names in UsedSelection documents
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('../src/models/League');
require('../src/models/User');
const UsedSelection = require('../src/models/UsedSelection');
const { normalizeDriver, normalizeTeam } = require('../../shared/normalization');

async function normalizeAllUsedSelections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1');
    console.log('Connected to MongoDB');

    const usedSelections = await UsedSelection.find({});
    console.log(`Found ${usedSelections.length} UsedSelection documents to normalize`);

    let updated = 0;
    for (const doc of usedSelections) {
      let changed = false;
      const origMain = [...doc.usedMainDrivers];
      const origReserve = [...doc.usedReserveDrivers];
      const origTeams = [...doc.usedTeams];
      // Normalize all entries
      doc.usedMainDrivers = doc.usedMainDrivers.map(normalizeDriver);
      doc.usedReserveDrivers = doc.usedReserveDrivers.map(normalizeDriver);
      doc.usedTeams = doc.usedTeams.map(normalizeTeam);
      // Check if any changes were made
      if (
        JSON.stringify(origMain) !== JSON.stringify(doc.usedMainDrivers) ||
        JSON.stringify(origReserve) !== JSON.stringify(doc.usedReserveDrivers) ||
        JSON.stringify(origTeams) !== JSON.stringify(doc.usedTeams)
      ) {
        changed = true;
      }
      if (changed) {
        await doc.save();
        updated++;
        console.log(`Updated UsedSelection ${doc._id}:`, {
          usedMainDrivers: { before: origMain, after: doc.usedMainDrivers },
          usedReserveDrivers: { before: origReserve, after: doc.usedReserveDrivers },
          usedTeams: { before: origTeams, after: doc.usedTeams }
        });
      }
    }
    console.log(`Normalization complete. Updated ${updated} UsedSelection documents.`);
    process.exit(0);
  } catch (err) {
    console.error('Error during normalization:', err);
    process.exit(1);
  }
}

normalizeAllUsedSelections(); 