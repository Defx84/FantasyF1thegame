// Shared normalization utility for drivers and teams

// Canonical driver and team data (copy from backend constants)
const F1_DRIVERS_2025 = [
  { name: 'Max Verstappen', shortName: 'M. Verstappen', alternateNames: ['M. Verstappen', 'Max', 'Verstappen', 'M Verstappen'] },
  { name: 'Yuki Tsunoda', shortName: 'Y. Tsunoda', alternateNames: ['Y. Tsunoda', 'Yuki', 'Tsunoda', 'Y Tsunoda'] },
  { name: 'George Russell', shortName: 'G. Russell', alternateNames: ['G. Russell', 'George', 'Russell', 'G Russell'] },
  { name: 'Kimi Antonelli', shortName: 'K. Antonelli', alternateNames: ['K. Antonelli', 'A. Antonelli', 'Kimi', 'Antonelli', 'K Antonelli', 'A Antonelli'] },
  { name: 'Charles Leclerc', shortName: 'C. Leclerc', alternateNames: ['C. Leclerc', 'Charles', 'Leclerc', 'C Leclerc'] },
  { name: 'Lewis Hamilton', shortName: 'L. Hamilton', alternateNames: ['L. Hamilton', 'Lewis', 'Hamilton', 'L Hamilton'] },
  { name: 'Oscar Piastri', shortName: 'O. Piastri', alternateNames: ['O. Piastri', 'Oscar', 'Piastri', 'O Piastri'] },
  { name: 'Lando Norris', shortName: 'L. Norris', alternateNames: ['L. Norris', 'Lando', 'Norris', 'L Norris'] },
  { name: 'Lance Stroll', shortName: 'L. Stroll', alternateNames: ['L. Stroll', 'Lance', 'Stroll', 'L Stroll'] },
  { name: 'Fernando Alonso', shortName: 'F. Alonso', alternateNames: ['F. Alonso', 'Fernando', 'Alonso', 'F Alonso'] },
  { name: 'Esteban Ocon', shortName: 'E. Ocon', alternateNames: ['E. Ocon', 'Esteban', 'Ocon', 'E Ocon'] },
  { name: 'Oliver Bearman', shortName: 'O. Bearman', alternateNames: ['O. Bearman', 'Oliver', 'Bearman', 'O Bearman'] },
  { name: 'Alexander Albon', shortName: 'A. Albon', alternateNames: ['A. Albon', 'Alex', 'Albon', 'A Albon'] },
  { name: 'Carlos Sainz', shortName: 'C. Sainz', alternateNames: ['C. Sainz', 'Carlos', 'Sainz', 'C Sainz'] },
  { name: 'Liam Lawson', shortName: 'L. Lawson', alternateNames: ['L. Lawson', 'Liam', 'Lawson', 'L Lawson'] },
  { name: 'Isack Hadjar', shortName: 'I. Hadjar', alternateNames: ['I. Hadjar', 'Isack', 'Hadjar', 'I Hadjar'] },
  { name: 'Pierre Gasly', shortName: 'P. Gasly', alternateNames: ['P. Gasly', 'Pierre', 'Gasly', 'P Gasly'] },
  { name: 'Jack Doohan', shortName: 'J. Doohan', alternateNames: ['J. Doohan', 'Jack', 'Doohan', 'J Doohan'] },
  { name: 'Nico Hulkenberg', shortName: 'N. Hulkenberg', alternateNames: ['N. Hulkenberg', 'Nico', 'Hulkenberg', 'N Hulkenberg'] },
  { name: 'Gabriel Bortoleto', shortName: 'G. Bortoleto', alternateNames: ['G. Bortoleto', 'Gabriel', 'Bortoleto', 'G Bortoleto'] }
];

const F1_TEAMS_2025 = [
  { name: 'Red Bull Racing', shortName: 'Red Bull', alternateNames: ['Red Bull', 'Red Bull Racing'] },
  { name: 'Mercedes', shortName: 'Mercedes', alternateNames: ['Mercedes AMG', 'Mercedes'] },
  { name: 'Ferrari', shortName: 'Ferrari', alternateNames: ['Ferrari'] },
  { name: 'McLaren', shortName: 'McLaren', alternateNames: ['McLaren Mercedes', 'McLaren'] },
  { name: 'Aston Martin', shortName: 'Aston Martin', alternateNames: ['Aston Martin Aramco', 'Aston Martin Racing'] },
  { name: 'Alpine', shortName: 'Alpine', alternateNames: ['Alpine Renault', 'Alpine'] },
  { name: 'Williams', shortName: 'Williams', alternateNames: ['Williams Mercedes', 'Williams'] },
  { name: 'RB', shortName: 'RB', alternateNames: ['Racing Bulls', 'Visa Cash App RB', 'VCARB', 'Visa Cash App Racing Bulls'] },
  { name: 'Stake F1 Team Kick Sauber', shortName: 'Kick Sauber', alternateNames: ['Stake F1 Team', 'Kick Sauber', 'Sauber'] },
  { name: 'Haas F1 Team', shortName: 'Haas', alternateNames: ['Haas Ferrari', 'Haas', 'MoneyGram Haas F1 Team', 'MoneyGram Haas'] }
];

// Build driver normalization map (all variations to short name)
const driverNameToShortName = new Map();
F1_DRIVERS_2025.forEach(driver => {
  driverNameToShortName.set(driver.name.toLowerCase().trim(), driver.shortName);
  driverNameToShortName.set(driver.shortName.toLowerCase().trim(), driver.shortName);
  driver.alternateNames.forEach(name => {
    driverNameToShortName.set(name.toLowerCase().trim(), driver.shortName);
  });
  if (driver.shortName.includes('.')) {
    const noDot = driver.shortName.replace('.', '').toLowerCase().trim();
    driverNameToShortName.set(noDot, driver.shortName);
  }
});

function normalizeDriver(name) {
  if (!name || name === 'None') return '';
  const key = name.toLowerCase().trim();
  return driverNameToShortName.get(key) || key;
}

// Build team normalization map (all variations to canonical team name)
const teamNameToCanonical = new Map();
F1_TEAMS_2025.forEach(team => {
  teamNameToCanonical.set(team.name.toLowerCase(), team.name);
  teamNameToCanonical.set(team.shortName.toLowerCase(), team.name);
  team.alternateNames.forEach(name => {
    teamNameToCanonical.set(name.toLowerCase(), team.name);
  });
});

function normalizeTeam(name) {
  if (!name || name === 'None') return '';
  const key = name.toLowerCase().trim();
  return teamNameToCanonical.get(key) || key;
}

export { normalizeDriver, normalizeTeam, F1_DRIVERS_2025, F1_TEAMS_2025 }; 