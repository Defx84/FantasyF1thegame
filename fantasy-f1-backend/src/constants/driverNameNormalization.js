const { F1_DRIVERS_2025 } = require('./f1DriverData');

// Create a map for all driver name variations to their short names
const driverNameToShortName = new Map();

// Build normalized name mappings
F1_DRIVERS_2025.forEach(driver => {
    // Map full name to short name
    const fullName = driver.name.toLowerCase().trim();
    driverNameToShortName.set(fullName, driver.shortName);

    // Map short name to itself (normalized)
    const shortName = driver.shortName.toLowerCase().trim();
    driverNameToShortName.set(shortName, driver.shortName);

    // Map all alternate names to short name
    driver.alternateNames?.forEach(name => {
        const altName = name.toLowerCase().trim();
        driverNameToShortName.set(altName, driver.shortName);
    });

    // Add variations without dots (e.g., "L Norris" -> "L. Norris")
    if (driver.shortName.includes('.')) {
        const noDot = driver.shortName.replace('.', '').toLowerCase().trim();
        driverNameToShortName.set(noDot, driver.shortName);
    }
});

/**
 * Normalizes a driver name to its short form (e.g., "Lando Norris" -> "L. Norris")
 * @param {string} name - The driver name to normalize
 * @returns {string} The normalized short name, or the original name if not found
 */
function normalizeDriverName(name) {
    if (!name || name === 'None') return name;
    const key = name.toLowerCase().trim();
    return driverNameToShortName.get(key) || name;
}

/**
 * Checks if a driver name is valid (exists in our mapping)
 * @param {string} name - The driver name to validate
 * @returns {boolean} True if the name is valid, false otherwise
 */
function isValidDriver(name) {
    if (!name || name === 'None') return true;
    const key = name.toLowerCase().trim();
    return driverNameToShortName.has(key);
}

/**
 * Gets all valid variations of a driver's name
 * @param {string} name - The driver name to get variations for
 * @returns {string[]} Array of all valid name variations
 */
function getDriverNameVariations(name) {
    const normalized = normalizeDriverName(name);
    const variations = [];
    
    driverNameToShortName.forEach((shortName, variation) => {
        if (shortName === normalized) {
            variations.push(variation);
        }
    });
    
    return variations;
}

module.exports = {
    normalizeDriverName,
    isValidDriver,
    getDriverNameVariations,
    driverNameToShortName
}; 