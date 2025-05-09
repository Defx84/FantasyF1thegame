const { F1_DRIVERS_2025 } = require('./f1DriverData');
const { driverNameToShortName } = require('./driverNameNormalization');

// Create a set of all valid driver names (both full and short forms)
const validDriverNames = new Set();

// Add all variations of driver names
F1_DRIVERS_2025.forEach(driver => {
    // Add full name
    validDriverNames.add(driver.name.toLowerCase());
    
    // Add short name
    validDriverNames.add(driver.shortName.toLowerCase());
    
    // Add all alternate names
    driver.alternateNames.forEach(name => {
        validDriverNames.add(name.toLowerCase());
    });
});

// Create arrays of valid names for easy access
const normalizedDrivers = Array.from(validDriverNames);
const fullNames = F1_DRIVERS_2025.map(driver => driver.name);
const shortNames = F1_DRIVERS_2025.map(driver => driver.shortName);

// Helper function to check if a name is valid
const isValidDriverName = (name) => {
    if (!name) return false;
    return validDriverNames.has(name.toLowerCase());
};

module.exports = {
    normalizedDrivers,
    fullNames,
    shortNames,
    isValidDriverName,
    validDriverNames
}; 