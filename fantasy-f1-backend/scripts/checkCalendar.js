const mongoose = require('mongoose');
const RaceCalendar = require('../src/models/RaceCalendar');
require('dotenv').config();

async function checkCalendar() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const count = await RaceCalendar.countDocuments();
        console.log('\nTotal races in calendar:', count);

        if (count > 0) {
            const races = await RaceCalendar.find().sort({ round: 1 });
            console.log('\nRaces in calendar:');
            races.forEach(r => {
                console.log(`Round ${r.round}: ${r.raceName} (${r.date.toISOString().split('T')[0]})`);
            });
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkCalendar(); 