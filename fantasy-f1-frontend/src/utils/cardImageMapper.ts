/**
 * Maps card names to their actual image file paths
 * 
 * Images are located in: public/images/Driver Cards/ and public/images/Team Cards/
 * Naming convention: {Tier}_{CardName}.png
 */

interface CardImageMap {
  [key: string]: string;
}

// Driver card name to image filename mapping
const driverCardImageMap: CardImageMap = {
  '2× Points': 'Gold_X2.png',
  'Mirror': 'Gold_Mirror.png',
  'Switcheroo': 'Gold_Switcheroo.png',
  'Teamwork': 'Gold_Teamwork.png',
  'Team Orders': 'Silver_Team_Orders.png',
  'The lift': 'Silver_The_Lift.png',
  'Mystery Card': 'Silver_Mistery.png', // Note: image is "Mistery" not "Mystery"
  'Top 5 Boost': 'Silver_Top_5.png',
  'Top 10 Boost': 'Bronze_Top_10.png',
  '+3 Points': 'Bronze_+3.png',
  'Competitiveness': 'Bronze_Competitiveness.png',
  'Bottom 5': 'Bronze_Bottom_5.png'
};

// Team card name to image filename mapping
const teamCardImageMap: CardImageMap = {
  'Espionage': 'Gold_Espionage.png',
  'Podium': 'Gold_Podium.png',
  'Top 5': 'Gold_Top_5.png',
  'Undercut': 'Silver_Undercut.png',
  'Top 10': 'Silver_Top_10.png',
  'Mystery Card': 'Silver_Mistery.png',
  'Sponsors': 'Bronze_Spomsors.png', // Note: filename has typo "Spomsors"
  'Bottom 5': 'Bronze_Bottom_5.png',
  'Last Place Bonus': 'Bronze_Last_but_not_least.png' // Actual filename differs
};

/**
 * Get the image path for a card
 * @param cardName - The name of the card
 * @param cardType - 'driver' or 'team'
 * @returns The path to the card image
 */
export function getCardImagePath(cardName: string, cardType: 'driver' | 'team'): string {
  const imageMap = cardType === 'driver' ? driverCardImageMap : teamCardImageMap;
  const imageFileName = imageMap[cardName];
  
  if (imageFileName) {
    // Images are in public/images/DriverCards/ or public/images/TeamCards/
    // Folders renamed to remove spaces for better compatibility
    const folderName = cardType === 'driver' ? 'DriverCards' : 'TeamCards';
    return `/images/${folderName}/${imageFileName}`;
  }
  
  // Fallback to a simple data URI placeholder if image not found
  // This avoids 404 errors and rate limiting
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
}

