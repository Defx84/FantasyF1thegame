const { F1_DRIVERS_2025 } = require('../constants/f1DriverData');
const { normalizeDriverName } = require('../constants/driverNameNormalization');

// Create a set of all valid driver names
const normalizedDrivers = new Set();
F1_DRIVERS_2025.forEach(driver => {
    normalizedDrivers.add(driver.name.toLowerCase());
    normalizedDrivers.add(driver.shortName.toLowerCase());
    driver.alternateNames.forEach(name => {
        normalizedDrivers.add(name.toLowerCase());
    });
});

// ... rest of the file remains unchanged ... 