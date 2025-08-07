import { HelmetColors } from '../../services/avatarService';

export interface HelmetConfig {
  helmetPattern: number | null;
  helmetColors: HelmetColors;
  helmetNumber: string;
  size?: number;
}

export class HelmetRenderer {
  private baseTemplate: string;

  constructor() {
    // Base SVG template - this would normally be loaded from the file
    this.baseTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="160" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="helmetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#808080;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#808080;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="visorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2a2a2a;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:0.9" />
    </linearGradient>
  </defs>
  
  <!-- Main helmet body - side profile using ellipses -->
  <ellipse cx="100" cy="85" rx="85" ry="45" fill="url(#helmetGradient)" stroke="#333" stroke-width="2"/>
  
  <!-- Helmet top ridge -->
  <ellipse cx="100" cy="75" rx="75" ry="35" fill="none" stroke="#555" stroke-width="3" opacity="0.7"/>
  
  <!-- Visor - large curved visor -->
  <ellipse cx="100" cy="80" rx="70" ry="30" fill="url(#visorGradient)" stroke="#333" stroke-width="1"/>
  
  <!-- Visor reflection -->
  <ellipse cx="100" cy="75" rx="60" ry="20" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
  
  <!-- Visor pivot mechanism -->
  <circle cx="160" cy="80" r="5" fill="#333" stroke="#666" stroke-width="1"/>
  <circle cx="160" cy="80" r="2.5" fill="#666"/>
  
  <!-- Chin bar -->
  <ellipse cx="100" cy="110" rx="60" ry="15" fill="url(#helmetGradient)" stroke="#333" stroke-width="1"/>
  
  <!-- Chin vents -->
  <rect x="45" y="105" width="15" height="4" fill="#333" opacity="0.8"/>
  <rect x="70" y="105" width="15" height="4" fill="#333" opacity="0.8"/>
  
  <!-- Side panel for number -->
  <rect x="145" y="65" width="30" height="18" rx="4" fill="url(#helmetGradient)" stroke="#333" stroke-width="1"/>
  
  <!-- Rear spoiler extension -->
  <line x1="175" y1="85" x2="200" y2="110" stroke="#333" stroke-width="2"/>
  
  <!-- Pattern area (will be dynamically generated) -->
  <g id="pattern-area">
    <!-- Patterns will be inserted here -->
  </g>
  
  <!-- Number display (will be dynamically generated) -->
  <g id="number-display">
    <!-- Numbers will be inserted here -->
  </g>
</svg>`;
  }

  /**
   * Generate helmet SVG with custom colors, patterns, and number
   */
  generateHelmetSVG(config: HelmetConfig): string {
    const { helmetPattern, helmetColors, helmetNumber, size = 200 } = config;
    
    // Apply colors to the template
    let svg = this.applyColors(this.baseTemplate, helmetColors);
    
    // Add patterns
    svg = this.addPatterns(svg, helmetPattern, helmetColors.accent);
    
    // Add number
    svg = this.addNumber(svg, helmetNumber, helmetColors.accent);
    
    // Resize if needed
    if (size !== 200) {
      svg = this.resizeSVG(svg, size);
    }
    
    return svg;
  }

  /**
   * Apply colors to the helmet template
   */
  private applyColors(svg: string, colors: HelmetColors): string {
    // Replace gradient colors
    svg = svg.replace(
      /<linearGradient id="helmetGradient"[^>]*>[\s\S]*?<\/linearGradient>/,
      `<linearGradient id="helmetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
      </linearGradient>`
    );
    
    return svg;
  }

  /**
   * Add patterns to the helmet
   */
  private addPatterns(svg: string, patternType: number | null, accentColor: string): string {
    if (!patternType) return svg;

    const patternSVG = this.generatePatternSVG(patternType, accentColor);
    
    // Replace the pattern area
    svg = svg.replace(
      /<g id="pattern-area">[\s\S]*?<\/g>/,
      `<g id="pattern-area">${patternSVG}</g>`
    );
    
    return svg;
  }

  /**
   * Generate pattern SVG based on pattern type
   */
  private generatePatternSVG(patternType: number, accentColor: string): string {
    switch (patternType) {
      case 1:
        return this.generateHorizontalStripes(accentColor);
      case 2:
        return this.generateVShapeStripes(accentColor);
      case 3:
        return this.generateZigzagStripes(accentColor);
      default:
        return '';
    }
  }

  /**
   * Generate horizontal stripes pattern
   */
  private generateHorizontalStripes(accentColor: string): string {
    return `
      <ellipse cx="100" cy="75" rx="70" ry="2" fill="${accentColor}" opacity="0.8"/>
      <ellipse cx="100" cy="90" rx="70" ry="2" fill="${accentColor}" opacity="0.8"/>
      <ellipse cx="100" cy="105" rx="70" ry="2" fill="${accentColor}" opacity="0.8"/>
    `;
  }

  /**
   * Generate V-shape converging stripes pattern
   */
  private generateVShapeStripes(accentColor: string): string {
    return `
      <ellipse cx="100" cy="75" rx="70" ry="2" fill="${accentColor}" opacity="0.8" transform="rotate(-15 100 75)"/>
      <ellipse cx="100" cy="90" rx="70" ry="2" fill="${accentColor}" opacity="0.8" transform="rotate(-10 100 90)"/>
      <ellipse cx="100" cy="105" rx="70" ry="2" fill="${accentColor}" opacity="0.8" transform="rotate(-5 100 105)"/>
    `;
  }

  /**
   * Generate zigzag stripes pattern
   */
  private generateZigzagStripes(accentColor: string): string {
    return `
      <ellipse cx="100" cy="75" rx="70" ry="2" fill="${accentColor}" opacity="0.8" transform="rotate(15 100 75)"/>
      <ellipse cx="100" cy="90" rx="70" ry="2" fill="${accentColor}" opacity="0.8" transform="rotate(-15 100 90)"/>
      <ellipse cx="100" cy="105" rx="70" ry="2" fill="${accentColor}" opacity="0.8" transform="rotate(15 100 105)"/>
    `;
  }

  /**
   * Add number to the helmet
   */
  private addNumber(svg: string, number: string, accentColor: string): string {
    const numberSVG = `
      <text x="160" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${accentColor}">${number}</text>
    `;
    
    // Replace the number display area
    svg = svg.replace(
      /<g id="number-display">[\s\S]*?<\/g>/,
      `<g id="number-display">${numberSVG}</g>`
    );
    
    return svg;
  }

  /**
   * Resize SVG to specified dimensions
   */
  private resizeSVG(svg: string, size: number): string {
    const aspectRatio = 200 / 160; // width / height
    const width = size;
    const height = size / aspectRatio;
    
    return svg.replace(
      /width="[^"]*" height="[^"]*"/,
      `width="${width}" height="${height}"`
    );
  }

  /**
   * Generate a simple test helmet for debugging
   */
  generateTestHelmet(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="160" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="testGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF0000;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0000FF;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Simple test helmet shape -->
  <ellipse cx="100" cy="80" rx="80" ry="50" fill="url(#testGradient)" stroke="#333" stroke-width="3"/>
  
  <!-- Test visor -->
  <ellipse cx="100" cy="75" rx="60" ry="25" fill="#2a2a2a" stroke="#333" stroke-width="2"/>
  
  <!-- Test number -->
  <text x="100" y="85" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#FFFF00">44</text>
</svg>`;
  }
}

export const helmetRenderer = new HelmetRenderer(); 