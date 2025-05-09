const mongoose = require('mongoose');
const RaceCalendar = require('../src/models/RaceCalendar');
require('dotenv').config();

// 2025 F1 Calendar
const F1_2025_CALENDAR = [
  {
    round: 1,
    raceName: "Australian Grand Prix",
    circuit: "Albert Park Circuit",
    country: "Australia",
    date: new Date("2025-03-16"),
    raceStart: new Date("2025-03-16T05:00:00Z"),
    qualifyingStart: new Date("2025-03-15T05:00:00Z")
  },
  {
    round: 2,
    raceName: "Chinese Grand Prix",
    circuit: "Shanghai International Circuit",
    country: "China",
    date: new Date("2025-03-23"),
    raceStart: new Date("2025-03-23T07:00:00Z"),
    qualifyingStart: new Date("2025-03-22T07:00:00Z")
  },
  {
    round: 3,
    raceName: "Japanese Grand Prix",
    circuit: "Suzuka International Racing Course",
    country: "Japan",
    date: new Date("2025-04-06"),
    raceStart: new Date("2025-04-06T06:00:00Z"),
    qualifyingStart: new Date("2025-04-05T06:00:00Z")
  },
  {
    round: 4,
    raceName: "Bahrain Grand Prix",
    circuit: "Bahrain International Circuit",
    country: "Bahrain",
    date: new Date("2025-04-13"),
    raceStart: new Date("2025-04-13T15:00:00Z"),
    qualifyingStart: new Date("2025-04-12T15:00:00Z")
  },
  {
    round: 5,
    raceName: "Saudi Arabian Grand Prix",
    circuit: "Jeddah Corniche Circuit",
    country: "Saudi Arabia",
    date: new Date("2025-04-20"),
    raceStart: new Date("2025-04-20T17:00:00Z"),
    qualifyingStart: new Date("2025-04-19T17:00:00Z")
  },
  {
    round: 6,
    raceName: "Miami Grand Prix",
    circuit: "Miami International Autodrome",
    country: "USA",
    date: new Date("2025-05-04"),
    raceStart: new Date("2025-05-04T19:00:00Z"),
    qualifyingStart: new Date("2025-05-03T19:00:00Z")
  },
  {
    round: 7,
    raceName: "Emilia Romagna Grand Prix",
    circuit: "Imola Circuit",
    country: "Italy",
    date: new Date("2025-05-18"),
    raceStart: new Date("2025-05-18T13:00:00Z"),
    qualifyingStart: new Date("2025-05-17T13:00:00Z")
  },
  {
    round: 8,
    raceName: "Monaco Grand Prix",
    circuit: "Circuit de Monaco",
    country: "Monaco",
    date: new Date("2025-05-25"),
    raceStart: new Date("2025-05-25T13:00:00Z"),
    qualifyingStart: new Date("2025-05-24T13:00:00Z")
  },
  {
    round: 9,
    raceName: "Spanish Grand Prix",
    circuit: "Circuit de Barcelona-Catalunya",
    country: "Spain",
    date: new Date("2025-06-01"),
    raceStart: new Date("2025-06-01T13:00:00Z"),
    qualifyingStart: new Date("2025-05-31T13:00:00Z")
  },
  {
    round: 10,
    raceName: "Canadian Grand Prix",
    circuit: "Circuit Gilles Villeneuve",
    country: "Canada",
    date: new Date("2025-06-15"),
    raceStart: new Date("2025-06-15T18:00:00Z"),
    qualifyingStart: new Date("2025-06-14T18:00:00Z")
  },
  {
    round: 11,
    raceName: "Austrian Grand Prix",
    circuit: "Red Bull Ring",
    country: "Austria",
    date: new Date("2025-06-29"),
    raceStart: new Date("2025-06-29T13:00:00Z"),
    qualifyingStart: new Date("2025-06-28T13:00:00Z")
  },
  {
    round: 12,
    raceName: "British Grand Prix",
    circuit: "Silverstone Circuit",
    country: "UK",
    date: new Date("2025-07-06"),
    raceStart: new Date("2025-07-06T14:00:00Z"),
    qualifyingStart: new Date("2025-07-05T14:00:00Z")
  },
  {
    round: 13,
    raceName: "Belgian Grand Prix",
    circuit: "Circuit de Spa-Francorchamps",
    country: "Belgium",
    date: new Date("2025-07-27"),
    raceStart: new Date("2025-07-27T13:00:00Z"),
    qualifyingStart: new Date("2025-07-26T13:00:00Z")
  },
  {
    round: 14,
    raceName: "Hungarian Grand Prix",
    circuit: "Hungaroring",
    country: "Hungary",
    date: new Date("2025-08-03"),
    raceStart: new Date("2025-08-03T13:00:00Z"),
    qualifyingStart: new Date("2025-08-02T13:00:00Z")
  },
  {
    round: 15,
    raceName: "Dutch Grand Prix",
    circuit: "Circuit Zandvoort",
    country: "Netherlands",
    date: new Date("2025-08-31"),
    raceStart: new Date("2025-08-31T13:00:00Z"),
    qualifyingStart: new Date("2025-08-30T13:00:00Z")
  },
  {
    round: 16,
    raceName: "Italian Grand Prix",
    circuit: "Monza Circuit",
    country: "Italy",
    date: new Date("2025-09-07"),
    raceStart: new Date("2025-09-07T13:00:00Z"),
    qualifyingStart: new Date("2025-09-06T13:00:00Z")
  },
  {
    round: 17,
    raceName: "Azerbaijan Grand Prix",
    circuit: "Baku City Circuit",
    country: "Azerbaijan",
    date: new Date("2025-09-21"),
    raceStart: new Date("2025-09-21T12:00:00Z"),
    qualifyingStart: new Date("2025-09-20T12:00:00Z")
  },
  {
    round: 18,
    raceName: "Singapore Grand Prix",
    circuit: "Marina Bay Street Circuit",
    country: "Singapore",
    date: new Date("2025-10-05"),
    raceStart: new Date("2025-10-05T12:00:00Z"),
    qualifyingStart: new Date("2025-10-04T12:00:00Z")
  },
  {
    round: 19,
    raceName: "United States Grand Prix",
    circuit: "Circuit of the Americas",
    country: "USA",
    date: new Date("2025-10-19"),
    raceStart: new Date("2025-10-19T19:00:00Z"),
    qualifyingStart: new Date("2025-10-18T19:00:00Z")
  },
  {
    round: 20,
    raceName: "Mexican Grand Prix",
    circuit: "Autodromo Hermanos Rodriguez",
    country: "Mexico",
    date: new Date("2025-10-26"),
    raceStart: new Date("2025-10-26T20:00:00Z"),
    qualifyingStart: new Date("2025-10-25T20:00:00Z")
  },
  {
    round: 21,
    raceName: "Brazilian Grand Prix",
    circuit: "Interlagos Circuit",
    country: "Brazil",
    date: new Date("2025-11-09"),
    raceStart: new Date("2025-11-09T17:00:00Z"),
    qualifyingStart: new Date("2025-11-08T17:00:00Z")
  },
  {
    round: 22,
    raceName: "Las Vegas Grand Prix",
    circuit: "Las Vegas Strip Circuit",
    country: "USA",
    date: new Date("2025-11-22"),
    raceStart: new Date("2025-11-22T06:00:00Z"),
    qualifyingStart: new Date("2025-11-21T06:00:00Z")
  },
  {
    round: 23,
    raceName: "Qatar Grand Prix",
    circuit: "Lusail International Circuit",
    country: "Qatar",
    date: new Date("2025-11-30"),
    raceStart: new Date("2025-11-30T14:00:00Z"),
    qualifyingStart: new Date("2025-11-29T14:00:00Z")
  },
  {
    round: 24,
    raceName: "Abu Dhabi Grand Prix",
    circuit: "Yas Marina Circuit",
    country: "UAE",
    date: new Date("2025-12-07"),
    raceStart: new Date("2025-12-07T13:00:00Z"),
    qualifyingStart: new Date("2025-12-06T13:00:00Z")
  }
];

async function populateRaceCalendar() {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('Connection string:', process.env.MONGODB_URI);
        
        // Set mongoose options
        mongoose.set('strictQuery', false);
        
        // Connect to MongoDB with options
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('Successfully connected to MongoDB');

        // Clear existing calendar
        console.log('Clearing existing race calendar...');
        await RaceCalendar.deleteMany({});
        console.log('Cleared existing race calendar');

        // Add season to each race
        const racesWithSeason = F1_2025_CALENDAR.map(race => ({
            ...race,
            season: 2025
        }));

        // Insert new calendar
        console.log('Inserting new race calendar...');
        await RaceCalendar.insertMany(racesWithSeason);
        console.log('Successfully inserted new race calendar');

        console.log('\nRace calendar population completed!');
    } catch (error) {
        console.error('Error details:', {
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
        console.log('Disconnected from MongoDB');
    }
}

// Run the population script
populateRaceCalendar(); 