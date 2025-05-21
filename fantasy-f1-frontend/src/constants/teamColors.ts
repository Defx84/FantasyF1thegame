export const teamColors: { [key: string]: string } = {
  'McLaren': '#F58020',
  'Ferrari': '#E8002D',
  'Red Bull Racing': '#3671C6',
  'Mercedes': '#6CD3BF',
  'Aston Martin': '#358C75',
  'Alpine': '#FF87BC',
  'Haas F1 Team': '#B6BABD',
  'Racing Bulls': '#6692FF',
  'Williams': '#64C4FF',
  'Kick Sauber': '#00FF87',
  'Stake F1 Team Kick Sauber': '#00FF87',
  'Stake F1 Team': '#00FF87',
  'Sauber': '#00FF87'
};

export const getTeamColor = (teamName: string): string => {
  return teamColors[teamName] || '#FFFFFF';
}; 