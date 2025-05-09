require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
require('../src/models/User');  // Import User model
require('../src/models/League');  // Import League model
const RaceSelection = require('../src/models/RaceSelection');
const UsedSelection = require('../src/models/UsedSelection');

async function rebuildUsedSelections() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-f1';
    console.log('Attempting to connect to MongoDB at:', uri);
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear all existing used selections
    const deleteResult = await UsedSelection.deleteMany({});
    console.log('Cleared existing used selections:', deleteResult);

    // Get all race selections
    const selections = await RaceSelection.find({})
      .sort({ round: 1 }); // Process in chronological order

    console.log(`Found ${selections.length} race selections to process`);

    // Group selections by user and league
    const usedSelectionsMap = new Map();

    for (const selection of selections) {
      const key = `${selection.user}-${selection.league}`;
      console.log(`Processing selection for round ${selection.round}:`, {
        mainDriver: selection.mainDriver,
        reserveDriver: selection.reserveDriver,
        team: selection.team
      });
      
      if (!usedSelectionsMap.has(key)) {
        usedSelectionsMap.set(key, {
          user: selection.user,
          league: selection.league,
          usedMainDrivers: new Set(),
          usedReserveDrivers: new Set(),
          usedTeams: new Set()
        });
      }

      const userSelections = usedSelectionsMap.get(key);

      // Only add valid selections
      if (selection.mainDriver && selection.mainDriver !== 'None') {
        userSelections.usedMainDrivers.add(selection.mainDriver);
        console.log(`Added main driver ${selection.mainDriver} to used list`);
      }
      if (selection.reserveDriver && selection.reserveDriver !== 'None') {
        userSelections.usedReserveDrivers.add(selection.reserveDriver);
        console.log(`Added reserve driver ${selection.reserveDriver} to used list`);
      }
      if (selection.team && selection.team !== 'None') {
        userSelections.usedTeams.add(selection.team);
        console.log(`Added team ${selection.team} to used list`);
      }
    }

    // Create new UsedSelection documents
    let count = 0;
    for (const [key, data] of usedSelectionsMap) {
      const usedSelection = new UsedSelection({
        user: data.user,
        league: data.league,
        usedMainDrivers: Array.from(data.usedMainDrivers),
        usedReserveDrivers: Array.from(data.usedReserveDrivers),
        usedTeams: Array.from(data.usedTeams)
      });

      await usedSelection.save();
      console.log(`Rebuilt used selections for user-league ${key}:`, {
        usedMainDrivers: Array.from(data.usedMainDrivers),
        usedReserveDrivers: Array.from(data.usedReserveDrivers),
        usedTeams: Array.from(data.usedTeams)
      });
      count++;
    }

    console.log(`Successfully rebuilt used selections for ${count} user-league combinations`);
    process.exit(0);
  } catch (error) {
    console.error('Error rebuilding used selections:', error);
    console.error('Full error:', error.stack);
    process.exit(1);
  }
}

rebuildUsedSelections(); 