const mongoose = require('mongoose');
const RaceCalendar = require('../src/models/RaceCalendar');
require('dotenv').config();

/**
 * 2026 F1 Calendar
 * 
 * Official 2026 F1 calendar with exact dates and session times (UTC)
 * 
 * Sprint weekends (cards NOT available):
 * - Round 2: Chinese GP
 * - Round 6: Miami GP
 * - Round 7: Canadian GP
 * - Round 11: British GP
 * - Round 14: Dutch GP
 * - Round 18: Singapore GP
 */
const F1_2026_CALENDAR = [
  {
    round: 1,
    raceName: "Australian Grand Prix",
    circuit: "Albert Park Circuit",
    country: "Australia",
    date: new Date("2026-03-08"),
    raceStart: new Date("2026-03-08T05:00:00Z"), // Sun 05:00 UTC
    qualifyingStart: new Date("2026-03-07T06:00:00Z"), // Sat 06:00 UTC
    isSprintWeekend: false
  },
  {
    round: 2,
    raceName: "Chinese Grand Prix",
    circuit: "Shanghai International Circuit",
    country: "China",
    date: new Date("2026-03-15"),
    raceStart: new Date("2026-03-15T07:00:00Z"), // Sun 07:00 UTC
    qualifyingStart: new Date("2026-03-14T07:00:00Z"), // Sat 07:00 UTC
    isSprintWeekend: true,
    sprintStart: new Date("2026-03-14T03:00:00Z"), // Sat 03:00 UTC
    sprintQualifyingStart: new Date("2026-03-13T07:30:00Z") // Fri 07:30 UTC
  },
  {
    round: 3,
    raceName: "Japanese Grand Prix",
    circuit: "Suzuka International Racing Course",
    country: "Japan",
    date: new Date("2026-03-29"),
    raceStart: new Date("2026-03-29T05:00:00Z"), // Sun 05:00 UTC
    qualifyingStart: new Date("2026-03-28T06:00:00Z"), // Sat 06:00 UTC
    isSprintWeekend: false
  },
  {
    round: 4,
    raceName: "Bahrain Grand Prix",
    circuit: "Bahrain International Circuit",
    country: "Bahrain",
    date: new Date("2026-04-12"),
    raceStart: new Date("2026-04-12T16:00:00Z"), // Sun 16:00 UTC
    qualifyingStart: new Date("2026-04-11T17:00:00Z"), // Sat 17:00 UTC
    isSprintWeekend: false
  },
  {
    round: 5,
    raceName: "Saudi Arabian Grand Prix",
    circuit: "Jeddah Corniche Circuit",
    country: "Saudi Arabia",
    date: new Date("2026-04-19"),
    raceStart: new Date("2026-04-19T18:00:00Z"), // Sun 18:00 UTC
    qualifyingStart: new Date("2026-04-18T18:00:00Z"), // Sat 18:00 UTC
    isSprintWeekend: false
  },
  {
    round: 6,
    raceName: "Miami Grand Prix",
    circuit: "Miami International Autodrome",
    country: "USA",
    date: new Date("2026-05-03"),
    raceStart: new Date("2026-05-03T20:00:00Z"), // Sun 20:00 UTC
    qualifyingStart: new Date("2026-05-02T20:00:00Z"), // Sat 20:00 UTC
    isSprintWeekend: true,
    sprintStart: new Date("2026-05-02T16:00:00Z"), // Sat 16:00 UTC
    sprintQualifyingStart: new Date("2026-05-01T20:30:00Z") // Fri 20:30 UTC
  },
  {
    round: 7,
    raceName: "Canadian Grand Prix",
    circuit: "Circuit Gilles Villeneuve",
    country: "Canada",
    date: new Date("2026-05-24"),
    raceStart: new Date("2026-05-24T17:00:00Z"), // Sun 17:00 UTC
    qualifyingStart: new Date("2026-05-23T17:00:00Z"), // Sat 17:00 UTC
    isSprintWeekend: true,
    sprintStart: new Date("2026-05-23T13:00:00Z"), // Sat 13:00 UTC
    sprintQualifyingStart: new Date("2026-05-22T17:30:00Z") // Fri 17:30 UTC
  },
  {
    round: 8,
    raceName: "Monaco Grand Prix",
    circuit: "Circuit de Monaco",
    country: "Monaco",
    date: new Date("2026-06-07"),
    raceStart: new Date("2026-06-07T13:00:00Z"), // Sun 13:00 UTC
    qualifyingStart: new Date("2026-06-06T14:00:00Z"), // Sat 14:00 UTC
    isSprintWeekend: false
  },
  {
    round: 9,
    raceName: "Spanish Grand Prix",
    circuit: "Circuit de Barcelona-Catalunya",
    country: "Spain",
    date: new Date("2026-06-14"),
    raceStart: new Date("2026-06-14T13:00:00Z"), // Sun 13:00 UTC
    qualifyingStart: new Date("2026-06-13T14:00:00Z"), // Sat 14:00 UTC
    isSprintWeekend: false
  },
  {
    round: 10,
    raceName: "Austrian Grand Prix",
    circuit: "Red Bull Ring",
    country: "Austria",
    date: new Date("2026-06-28"),
    raceStart: new Date("2026-06-28T13:00:00Z"), // Sun 13:00 UTC
    qualifyingStart: new Date("2026-06-27T13:00:00Z"), // Sat 13:00 UTC
    isSprintWeekend: false
  },
  {
    round: 11,
    raceName: "British Grand Prix",
    circuit: "Silverstone Circuit",
    country: "UK",
    date: new Date("2026-07-05"),
    raceStart: new Date("2026-07-05T13:00:00Z"), // Sun 13:00 UTC
    qualifyingStart: new Date("2026-07-04T14:00:00Z"), // Sat 14:00 UTC
    isSprintWeekend: true,
    sprintStart: new Date("2026-07-04T10:00:00Z"), // Sat 10:00 UTC
    sprintQualifyingStart: new Date("2026-07-03T14:30:00Z") // Fri 14:30 UTC
  },
  {
    round: 12,
    raceName: "Belgian Grand Prix",
    circuit: "Circuit de Spa-Francorchamps",
    country: "Belgium",
    date: new Date("2026-07-19"),
    raceStart: new Date("2026-07-19T13:00:00Z"), // Sun 13:00 UTC
    qualifyingStart: new Date("2026-07-18T13:00:00Z"), // Sat 13:00 UTC
    isSprintWeekend: false
  },
  {
    round: 13,
    raceName: "Hungarian Grand Prix",
    circuit: "Hungaroring",
    country: "Hungary",
    date: new Date("2026-07-26"),
    raceStart: new Date("2026-07-26T13:00:00Z"), // Sun 13:00 UTC
    qualifyingStart: new Date("2026-07-25T13:00:00Z"), // Sat 13:00 UTC
    isSprintWeekend: false
  },
  {
    round: 14,
    raceName: "Dutch Grand Prix",
    circuit: "Circuit Zandvoort",
    country: "Netherlands",
    date: new Date("2026-08-23"),
    raceStart: new Date("2026-08-23T13:00:00Z"), // Sun 13:00 UTC
    qualifyingStart: new Date("2026-08-22T14:00:00Z"), // Sat 14:00 UTC
    isSprintWeekend: true,
    sprintStart: new Date("2026-08-22T10:00:00Z"), // Sat 10:00 UTC
    sprintQualifyingStart: new Date("2026-08-21T14:30:00Z") // Fri 14:30 UTC
  },
  {
    round: 15,
    raceName: "Italian Grand Prix",
    circuit: "Monza Circuit",
    country: "Italy",
    date: new Date("2026-09-06"),
    raceStart: new Date("2026-09-06T13:00:00Z"), // Sun 13:00 UTC
    qualifyingStart: new Date("2026-09-05T14:00:00Z"), // Sat 14:00 UTC
    isSprintWeekend: false
  },
  {
    round: 16,
    raceName: "Spanish Grand Prix",
    circuit: "Madrid Circuit",
    country: "Spain",
    date: new Date("2026-09-13"),
    raceStart: new Date("2026-09-13T13:00:00Z"), // Sun 13:00 UTC
    qualifyingStart: new Date("2026-09-12T14:00:00Z"), // Sat 14:00 UTC
    isSprintWeekend: false
  },
  {
    round: 17,
    raceName: "Azerbaijan Grand Prix",
    circuit: "Baku City Circuit",
    country: "Azerbaijan",
    date: new Date("2026-09-26"),
    raceStart: new Date("2026-09-26T12:00:00Z"), // Sun 12:00 UTC
    qualifyingStart: new Date("2026-09-25T14:00:00Z"), // Sat 14:00 UTC
    isSprintWeekend: false
  },
  {
    round: 18,
    raceName: "Singapore Grand Prix",
    circuit: "Marina Bay Street Circuit",
    country: "Singapore",
    date: new Date("2026-10-11"),
    raceStart: new Date("2026-10-11T13:00:00Z"), // Sun 13:00 UTC
    qualifyingStart: new Date("2026-10-10T14:00:00Z"), // Sat 14:00 UTC
    isSprintWeekend: true,
    sprintStart: new Date("2026-10-10T10:00:00Z"), // Sat 10:00 UTC
    sprintQualifyingStart: new Date("2026-10-09T13:30:00Z") // Fri 13:30 UTC
  },
  {
    round: 19,
    raceName: "United States Grand Prix",
    circuit: "Circuit of the Americas",
    country: "USA",
    date: new Date("2026-10-25"),
    raceStart: new Date("2026-10-25T20:00:00Z"), // Sun 20:00 UTC
    qualifyingStart: new Date("2026-10-24T22:00:00Z"), // Sat 22:00 UTC
    isSprintWeekend: false
  },
  {
    round: 20,
    raceName: "Mexican Grand Prix",
    circuit: "Autodromo Hermanos Rodriguez",
    country: "Mexico",
    date: new Date("2026-11-01"),
    raceStart: new Date("2026-11-01T20:00:00Z"), // Sun 20:00 UTC
    qualifyingStart: new Date("2026-10-31T21:00:00Z"), // Sat 21:00 UTC
    isSprintWeekend: false
  },
  {
    round: 21,
    raceName: "São Paulo Grand Prix",
    circuit: "Interlagos Circuit",
    country: "Brazil",
    date: new Date("2026-11-08"),
    raceStart: new Date("2026-11-08T17:00:00Z"), // Sun 17:00 UTC
    qualifyingStart: new Date("2026-11-07T18:00:00Z"), // Sat 18:00 UTC
    isSprintWeekend: false
  },
  {
    round: 22,
    raceName: "Las Vegas Grand Prix",
    circuit: "Las Vegas Strip Circuit",
    country: "USA",
    date: new Date("2026-11-22"),
    raceStart: new Date("2026-11-22T06:00:00Z"), // Sun 06:00 UTC
    qualifyingStart: new Date("2026-11-21T06:00:00Z"), // Sat 06:00 UTC
    isSprintWeekend: false
  },
  {
    round: 23,
    raceName: "Qatar Grand Prix",
    circuit: "Lusail International Circuit",
    country: "Qatar",
    date: new Date("2026-11-29"),
    raceStart: new Date("2026-11-29T16:00:00Z"), // Sun 16:00 UTC
    qualifyingStart: new Date("2026-11-28T17:00:00Z"), // Sat 17:00 UTC
    isSprintWeekend: false
  },
  {
    round: 24,
    raceName: "Abu Dhabi Grand Prix",
    circuit: "Yas Marina Circuit",
    country: "UAE",
    date: new Date("2026-12-06"),
    raceStart: new Date("2026-12-06T13:00:00Z"), // Sun 13:00 UTC
    qualifyingStart: new Date("2026-12-05T13:00:00Z"), // Sat 13:00 UTC
    isSprintWeekend: false
  }
];

async function populate2026Calendar() {
  try {
    console.log('📅 Populating 2026 F1 Calendar...\n');
    console.log('Attempting to connect to MongoDB...');
    
    // Set mongoose options
    mongoose.set('strictQuery', false);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Successfully connected to MongoDB\n');

    // Drop old unique index on round if it exists, and ensure compound index exists
    console.log('🔧 Updating database indexes...');
    try {
      const collection = mongoose.connection.collection('racecalendars');
      // Drop old unique index on round (if it exists)
      const indexes = await collection.indexes();
      const oldRoundIndex = indexes.find(idx => idx.key && idx.key.round === 1 && !idx.key.season);
      if (oldRoundIndex) {
        await collection.dropIndex(oldRoundIndex.name);
        console.log('   Dropped old unique index on round\n');
      }
      // Ensure compound index exists (Mongoose will create it automatically, but we verify)
      await collection.createIndex({ round: 1, season: 1 }, { unique: true });
      console.log('   Created compound unique index on (round, season)\n');
    } catch (indexError) {
      console.log('   Index update note:', indexError.message);
      console.log('   (This is usually fine if indexes already exist)\n');
    }

    // Clear existing 2026 calendar (if any)
    console.log('🗑️  Clearing existing 2026 race calendar...');
    const deleted = await RaceCalendar.deleteMany({ season: 2026 });
    console.log(`   Deleted ${deleted.deletedCount} existing 2026 races\n`);

    // Add season to each race
    const racesWithSeason = F1_2026_CALENDAR.map(race => ({
      ...race,
      season: 2026
    }));

    // Insert new calendar
    console.log('📝 Inserting 2026 race calendar...');
    const inserted = await RaceCalendar.insertMany(racesWithSeason);
    console.log(`✅ Successfully inserted ${inserted.length} races for 2026\n`);

    // Summary
    const sprintCount = racesWithSeason.filter(r => r.isSprintWeekend).length;
    const regularCount = racesWithSeason.length - sprintCount;
    
    console.log('📊 Calendar Summary:');
    console.log(`   Total races: ${racesWithSeason.length}`);
    console.log(`   Regular weekends: ${regularCount}`);
    console.log(`   Sprint weekends: ${sprintCount}`);
    console.log(`   Season: 2026\n`);

    // List sprint weekends (cards won't be available)
    if (sprintCount > 0) {
      console.log('⚠️  Sprint Weekends (Cards NOT available):');
      racesWithSeason
        .filter(r => r.isSprintWeekend)
        .forEach(r => {
          console.log(`   - Round ${r.round}: ${r.raceName}`);
        });
      console.log('');
    }

    console.log('✅ 2026 Race calendar population completed!');
  } catch (error) {
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'MongoNetworkError') {
      console.error('Network error connecting to MongoDB. Please check:');
      console.error('1. Your internet connection');
      console.error('2. The MongoDB connection string');
      console.error('3. MongoDB Atlas IP whitelist settings');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the population script
populate2026Calendar();

