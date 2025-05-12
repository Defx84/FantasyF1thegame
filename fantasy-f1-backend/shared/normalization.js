// F1 2025 Drivers and Teams data
const F1_DRIVERS_2025 = [
  'Max Verstappen',
  'Sergio Perez',
  'Lewis Hamilton',
  'George Russell',
  'Charles Leclerc',
  'Carlos Sainz',
  'Lando Norris',
  'Oscar Piastri',
  'Fernando Alonso',
  'Lance Stroll',
  'Esteban Ocon',
  'Pierre Gasly',
  'Alexander Albon',
  'Logan Sargeant',
  'Yuki Tsunoda',
  'Daniel Ricciardo',
  'Nico Hulkenberg',
  'Kevin Magnussen',
  'Valtteri Bottas',
  'Zhou Guanyu'
];

const F1_TEAMS_2025 = [
  'Red Bull Racing',
  'Mercedes',
  'Ferrari',
  'McLaren',
  'Aston Martin',
  'Alpine',
  'Williams',
  'RB',
  'Haas F1 Team',
  'Kick Sauber'
];

// Normalize driver names to match official F1 2025 list
function normalizeDriver(name) {
  if (!name) return null;
  
  // Convert to lowercase for case-insensitive matching
  const normalizedName = name.toLowerCase();
  
  // Find the official name that matches
  const officialName = F1_DRIVERS_2025.find(driver => 
    driver.toLowerCase() === normalizedName
  );
  
  return officialName || name; // Return original name if no match found
}

// Normalize team names to match official F1 2025 list
function normalizeTeam(name) {
  if (!name) return null;
  
  // Convert to lowercase for case-insensitive matching
  const normalizedName = name.toLowerCase();
  
  // Find the official name that matches
  const officialName = F1_TEAMS_2025.find(team => 
    team.toLowerCase() === normalizedName
  );
  
  return officialName || name; // Return original name if no match found
}

module.exports = {
  normalizeDriver,
  normalizeTeam,
  F1_DRIVERS_2025,
  F1_TEAMS_2025
}; 