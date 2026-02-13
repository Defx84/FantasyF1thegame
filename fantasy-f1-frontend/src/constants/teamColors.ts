export const teamColors: { [key: string]: string } = {
  'McLaren': '#F58020',
  'Ferrari': '#E8002D',
  'Red Bull Racing': '#3671C6',
  'Mercedes': '#6CD3BF',
  'Aston Martin': '#358C75',
  'Alpine': '#FF87BC',
  'Haas F1 Team': '#FFFFFF',
  'Racing Bulls': '#6692FF',
  'RB': '#6692FF', // same as Racing Bulls (2026 team name)
  'Williams': '#64C4FF',
  'Kick Sauber': '#00FF87',
  'Stake F1 Team Kick Sauber': '#00FF87',
  'Stake F1 Team': '#00FF87',
  'Sauber': '#00FF87',
  'Cadillac': '#9CA3AF',
  'Cadillac F1 Team': '#9CA3AF',
  'Cadillac Racing': '#9CA3AF',
  'Audi': '#FF4500', // Audi F1 car accent orange (side stripe)
  'Audi F1 Team': '#FF4500',
  'Audi Sport': '#FF4500',
};

export const getTeamColor = (teamName: string): string => {
  return teamColors[teamName] || '#FFFFFF';
}; 