export interface HelmetTemplate {
  id: number;
  name: string;
  svg: string;
  description: string;
}

export const helmetTemplates: HelmetTemplate[] = [
  {
    id: 1,
    name: "Classic Stripes",
    description: "Three horizontal diagonal stripes",
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="160" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="helmetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:var(--primary-color);stop-opacity:1" />
      <stop offset="100%" style="stop-color:var(--secondary-color);stop-opacity:1" />
    </linearGradient>
    <linearGradient id="visorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2a2a2a;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:0.9" />
    </linearGradient>
  </defs>
  
  <!-- Main helmet body -->
  <ellipse cx="100" cy="85" rx="85" ry="45" fill="url(#helmetGradient)" stroke="var(--accent-color)" stroke-width="2"/>
  
  <!-- Visor -->
  <ellipse cx="100" cy="80" rx="70" ry="30" fill="url(#visorGradient)" stroke="var(--accent-color)" stroke-width="1"/>
  
  <!-- Visor reflection -->
  <ellipse cx="100" cy="75" rx="60" ry="20" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
  
  <!-- Visor pivot mechanism -->
  <circle cx="160" cy="80" r="5" fill="var(--accent-color)" stroke="#666" stroke-width="1"/>
  <circle cx="160" cy="80" r="2.5" fill="#666"/>
  
  <!-- Chin bar -->
  <ellipse cx="100" cy="110" rx="60" ry="15" fill="url(#helmetGradient)" stroke="var(--accent-color)" stroke-width="1"/>
  
  <!-- Chin vents -->
  <rect x="45" y="105" width="15" height="4" fill="var(--accent-color)" opacity="0.8"/>
  <rect x="70" y="105" width="15" height="4" fill="var(--accent-color)" opacity="0.8"/>
  
  <!-- Side panel for number -->
  <rect x="145" y="65" width="30" height="18" rx="4" fill="url(#helmetGradient)" stroke="var(--accent-color)" stroke-width="1"/>
  
  <!-- Pattern: Three horizontal diagonal stripes -->
  <ellipse cx="100" cy="75" rx="70" ry="3" fill="var(--accent-color)" opacity="0.9"/>
  <ellipse cx="100" cy="90" rx="70" ry="3" fill="var(--accent-color)" opacity="0.9"/>
  <ellipse cx="100" cy="105" rx="70" ry="3" fill="var(--accent-color)" opacity="0.9"/>
  
  <!-- Number display area -->
  <g id="number-display">
    <!-- Number will be inserted here -->
  </g>
</svg>`
  },
  {
    id: 2,
    name: "V-Shape Design",
    description: "Three stripes converging in V-shape",
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="160" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="helmetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:var(--primary-color);stop-opacity:1" />
      <stop offset="100%" style="stop-color:var(--secondary-color);stop-opacity:1" />
    </linearGradient>
    <linearGradient id="visorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2a2a2a;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:0.9" />
    </linearGradient>
  </defs>
  
  <!-- Main helmet body -->
  <ellipse cx="100" cy="85" rx="85" ry="45" fill="url(#helmetGradient)" stroke="var(--accent-color)" stroke-width="2"/>
  
  <!-- Visor -->
  <ellipse cx="100" cy="80" rx="70" ry="30" fill="url(#visorGradient)" stroke="var(--accent-color)" stroke-width="1"/>
  
  <!-- Visor reflection -->
  <ellipse cx="100" cy="75" rx="60" ry="20" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
  
  <!-- Visor pivot mechanism -->
  <circle cx="160" cy="80" r="5" fill="var(--accent-color)" stroke="#666" stroke-width="1"/>
  <circle cx="160" cy="80" r="2.5" fill="#666"/>
  
  <!-- Chin bar -->
  <ellipse cx="100" cy="110" rx="60" ry="15" fill="url(#helmetGradient)" stroke="var(--accent-color)" stroke-width="1"/>
  
  <!-- Chin vents -->
  <rect x="45" y="105" width="15" height="4" fill="var(--accent-color)" opacity="0.8"/>
  <rect x="70" y="105" width="15" height="4" fill="var(--accent-color)" opacity="0.8"/>
  
  <!-- Side panel for number -->
  <rect x="145" y="65" width="30" height="18" rx="4" fill="url(#helmetGradient)" stroke="var(--accent-color)" stroke-width="1"/>
  
  <!-- Pattern: V-shape converging stripes -->
  <ellipse cx="100" cy="75" rx="70" ry="3" fill="var(--accent-color)" opacity="0.9" transform="rotate(-15 100 75)"/>
  <ellipse cx="100" cy="90" rx="70" ry="3" fill="var(--accent-color)" opacity="0.9" transform="rotate(-10 100 90)"/>
  <ellipse cx="100" cy="105" rx="70" ry="3" fill="var(--accent-color)" opacity="0.9" transform="rotate(-5 100 105)"/>
  
  <!-- Number display area -->
  <g id="number-display">
    <!-- Number will be inserted here -->
  </g>
</svg>`
  },
  {
    id: 3,
    name: "Zigzag Lightning",
    description: "Three zigzag lightning-like stripes",
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="160" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="helmetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:var(--primary-color);stop-opacity:1" />
      <stop offset="100%" style="stop-color:var(--secondary-color);stop-opacity:1" />
    </linearGradient>
    <linearGradient id="visorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2a2a2a;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:0.9" />
    </linearGradient>
  </defs>
  
  <!-- Main helmet body -->
  <ellipse cx="100" cy="85" rx="85" ry="45" fill="url(#helmetGradient)" stroke="var(--accent-color)" stroke-width="2"/>
  
  <!-- Visor -->
  <ellipse cx="100" cy="80" rx="70" ry="30" fill="url(#visorGradient)" stroke="var(--accent-color)" stroke-width="1"/>
  
  <!-- Visor reflection -->
  <ellipse cx="100" cy="75" rx="60" ry="20" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
  
  <!-- Visor pivot mechanism -->
  <circle cx="160" cy="80" r="5" fill="var(--accent-color)" stroke="#666" stroke-width="1"/>
  <circle cx="160" cy="80" r="2.5" fill="#666"/>
  
  <!-- Chin bar -->
  <ellipse cx="100" cy="110" rx="60" ry="15" fill="url(#helmetGradient)" stroke="var(--accent-color)" stroke-width="1"/>
  
  <!-- Chin vents -->
  <rect x="45" y="105" width="15" height="4" fill="var(--accent-color)" opacity="0.8"/>
  <rect x="70" y="105" width="15" height="4" fill="var(--accent-color)" opacity="0.8"/>
  
  <!-- Side panel for number -->
  <rect x="145" y="65" width="30" height="18" rx="4" fill="url(#helmetGradient)" stroke="var(--accent-color)" stroke-width="1"/>
  
  <!-- Pattern: Zigzag lightning stripes -->
  <ellipse cx="100" cy="75" rx="70" ry="3" fill="var(--accent-color)" opacity="0.9" transform="rotate(15 100 75)"/>
  <ellipse cx="100" cy="90" rx="70" ry="3" fill="var(--accent-color)" opacity="0.9" transform="rotate(-15 100 90)"/>
  <ellipse cx="100" cy="105" rx="70" ry="3" fill="var(--accent-color)" opacity="0.9" transform="rotate(15 100 105)"/>
  
  <!-- Number display area -->
  <g id="number-display">
    <!-- Number will be inserted here -->
  </g>
</svg>`
  }
];

export const getHelmetTemplate = (id: number): HelmetTemplate | undefined => {
  return helmetTemplates.find(template => template.id === id);
}; 