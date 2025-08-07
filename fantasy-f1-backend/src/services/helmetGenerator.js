const { createCanvas } = require('canvas');

class HelmetGenerator {
  constructor() {
    this.defaultColors = {
      primary: '#808080',
      secondary: '#808080', 
      accent: '#808080'
    };
  }

  /**
   * Generate helmet SVG based on configuration
   * @param {Object} config - Helmet configuration
   * @param {number} config.helmetPattern - Pattern type (1, 2, or 3)
   * @param {Object} config.helmetColors - Color configuration
   * @param {string} config.helmetNumber - Number to display on helmet
   * @returns {string} SVG string
   */
  generateHelmetSVG(config) {
    const { helmetPattern, helmetColors, helmetNumber } = config;
    const colors = { ...this.defaultColors, ...helmetColors };

    // Professional F1-style helmet design - side profile view
    const helmetSVG = `
      <svg width="200" height="160" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="helmetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </linearGradient>
          <linearGradient id="visorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#2a2a2a;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:0.9" />
          </linearGradient>
          <linearGradient id="shadowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#000000;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#000000;stop-opacity:0.1" />
          </linearGradient>
        </defs>
        
        <!-- Main helmet body - realistic aerodynamic shape -->
        <path d="M 15 85 Q 15 65 25 55 Q 35 45 55 40 Q 75 35 100 35 Q 125 35 145 40 Q 165 45 175 55 Q 185 65 185 85 Q 185 105 175 115 Q 165 125 145 130 Q 125 135 100 135 Q 75 135 55 130 Q 35 125 25 115 Q 15 105 15 85 Z" 
              fill="url(#helmetGradient)" stroke="#333" stroke-width="2"/>
        
        <!-- Helmet shadow/depth -->
        <path d="M 15 85 Q 15 65 25 55 Q 35 45 55 40 Q 75 35 100 35 Q 125 35 145 40 Q 165 45 175 55 Q 185 65 185 85" 
              fill="url(#shadowGradient)" stroke="none"/>
        
        <!-- Top ridge/vent structure -->
        <path d="M 20 75 Q 30 70 45 65 Q 65 60 100 60 Q 135 60 155 65 Q 170 70 180 75" 
              fill="none" stroke="#555" stroke-width="3" opacity="0.7"/>
        
        <!-- Visor - large curved visor -->
        <path d="M 30 80 Q 30 70 40 65 Q 50 60 65 60 Q 80 60 100 60 Q 120 60 135 60 Q 150 65 160 70 Q 170 75 170 85 Q 170 95 160 100 Q 150 105 135 105 Q 120 105 100 105 Q 80 105 65 105 Q 50 100 40 95 Q 30 90 30 80 Z" 
              fill="url(#visorGradient)" stroke="#333" stroke-width="1"/>
        
        <!-- Visor reflection -->
        <path d="M 35 75 Q 45 70 60 70 Q 80 70 100 70 Q 120 70 140 70 Q 155 70 165 75" 
              fill="none" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
        
        <!-- Visor pivot mechanism -->
        <circle cx="160" cy="80" r="5" fill="#333" stroke="#666" stroke-width="1"/>
        <circle cx="160" cy="80" r="2.5" fill="#666"/>
        
        <!-- Chin bar with vents -->
        <path d="M 15 85 Q 15 95 20 100 Q 25 105 35 110 Q 45 115 55 115 Q 65 115 75 110 Q 85 105 90 100 Q 95 95 95 85" 
              fill="url(#helmetGradient)" stroke="#333" stroke-width="1"/>
        
        <!-- Chin vents -->
        <rect x="40" y="100" width="15" height="4" fill="#333" opacity="0.8"/>
        <rect x="65" y="100" width="15" height="4" fill="#333" opacity="0.8"/>
        
        <!-- Side panel for number -->
        <rect x="145" y="65" width="30" height="18" rx="4" fill="url(#helmetGradient)" stroke="#333" stroke-width="1"/>
        
        <!-- Rear spoiler extension -->
        <path d="M 175 85 Q 180 90 185 95 Q 190 100 195 105 Q 200 110 205 115" 
              fill="none" stroke="#333" stroke-width="2"/>
        
        <!-- Helmet pattern based on type -->
        ${this.generatePattern(helmetPattern, colors)}
        
        <!-- Helmet number in side panel -->
        <text x="160" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${colors.accent}">${helmetNumber}</text>
      </svg>
    `;

    return helmetSVG;
  }

  /**
   * Generate pattern based on pattern type
   * @param {number} patternType - Pattern type (1, 2, or 3)
   * @param {Object} colors - Color configuration
   * @returns {string} SVG pattern elements
   */
  generatePattern(patternType, colors) {
    switch (patternType) {
      case 1:
        return this.generateHorizontalStripes(colors);
      case 2:
        return this.generateVShapeStripes(colors);
      case 3:
        return this.generateZigzagStripes(colors);
      default:
        return '';
    }
  }

  /**
   * Generate horizontal/oblique stripes pattern
   */
  generateHorizontalStripes(colors) {
    return `
      <!-- Horizontal stripes -->
      <path d="M 25 75 Q 35 75 45 75 Q 55 75 65 75 Q 75 75 85 75 Q 95 75 105 75 Q 115 75 125 75 Q 135 75 145 75 Q 155 75 165 75" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 25 90 Q 35 90 45 90 Q 55 90 65 90 Q 75 90 85 90 Q 95 90 105 90 Q 115 90 125 90 Q 135 90 145 90 Q 155 90 165 90" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 25 105 Q 35 105 45 105 Q 55 105 65 105 Q 75 105 85 105 Q 95 105 105 105 Q 115 105 125 105 Q 135 105 145 105 Q 155 105 165 105" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
    `;
  }

  /**
   * Generate V-shape converging stripes pattern
   */
  generateVShapeStripes(colors) {
    return `
      <!-- V-shape converging stripes -->
      <path d="M 25 75 Q 40 85 55 75 Q 70 85 85 75 Q 100 85 115 75 Q 130 85 145 75 Q 160 85 175 75" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 30 90 Q 45 100 60 90 Q 75 100 90 90 Q 105 100 120 90 Q 135 100 150 90 Q 165 100 180 90" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 35 105 Q 50 115 65 105 Q 80 115 95 105 Q 110 115 125 105 Q 140 115 155 105 Q 170 115 185 105" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
    `;
  }

  /**
   * Generate zigzag stripes pattern
   */
  generateZigzagStripes(colors) {
    return `
      <!-- Zigzag lines -->
      <path d="M 25 75 L 35 80 L 45 75 L 55 80 L 65 75 L 75 80 L 85 75 L 95 80 L 105 75 L 115 80 L 125 75 L 135 80 L 145 75 L 155 80 L 165 75" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 25 90 L 35 95 L 45 90 L 55 95 L 65 90 L 75 95 L 85 90 L 95 95 L 105 90 L 115 95 L 125 90 L 135 95 L 145 90 L 155 95 L 165 90" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 25 105 L 35 110 L 45 105 L 55 110 L 65 105 L 75 110 L 85 105 L 95 110 L 105 105 L 115 110 L 125 105 L 135 110 L 145 105 L 155 110 L 165 105" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
    `;
  }

  /**
   * Generate PNG from SVG (for caching)
   * @param {string} svgString - SVG string
   * @param {number} size - Output size (64, 128, 256)
   * @returns {Buffer} PNG buffer
   */
  async generatePNG(svgString, size = 128) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Convert SVG to image
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
        const buffer = canvas.toBuffer('image/png');
        URL.revokeObjectURL(url);
        resolve(buffer);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Get default helmet configuration
   * @returns {Object} Default helmet config
   */
  getDefaultHelmet() {
    return {
      helmetPattern: null,
      helmetColors: this.defaultColors,
      helmetNumber: '-',
      isCustomized: false
    };
  }
}

module.exports = new HelmetGenerator(); 