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
        </defs>
        
        <!-- Main helmet body - realistic aerodynamic shape -->
        <path d="M 20 80 Q 20 60 30 50 Q 40 40 60 35 Q 80 30 100 30 Q 120 30 140 35 Q 160 40 170 50 Q 180 60 180 80 Q 180 100 170 110 Q 160 120 140 125 Q 120 130 100 130 Q 80 130 60 125 Q 40 120 30 110 Q 20 100 20 80 Z" 
              fill="url(#helmetGradient)" stroke="#333" stroke-width="2"/>
        
        <!-- Top ridge/vent structure -->
        <path d="M 25 70 Q 35 65 50 60 Q 70 55 100 55 Q 130 55 150 60 Q 165 65 175 70" 
              fill="none" stroke="#555" stroke-width="3" opacity="0.7"/>
        
        <!-- Visor - large curved visor -->
        <path d="M 35 75 Q 35 65 45 60 Q 55 55 70 55 Q 85 55 100 55 Q 115 55 130 55 Q 145 60 155 65 Q 165 70 165 80 Q 165 90 155 95 Q 145 100 130 100 Q 115 100 100 100 Q 85 100 70 100 Q 55 95 45 90 Q 35 85 35 75 Z" 
              fill="url(#visorGradient)" stroke="#333" stroke-width="1"/>
        
        <!-- Visor pivot mechanism -->
        <circle cx="155" cy="75" r="4" fill="#333" stroke="#666" stroke-width="1"/>
        <circle cx="155" cy="75" r="2" fill="#666"/>
        
        <!-- Chin bar with vents -->
        <path d="M 20 80 Q 20 90 25 95 Q 30 100 40 105 Q 50 110 60 110 Q 70 110 80 105 Q 90 100 95 95 Q 100 90 100 80" 
              fill="url(#helmetGradient)" stroke="#333" stroke-width="1"/>
        
        <!-- Chin vents -->
        <rect x="45" y="95" width="12" height="3" fill="#333" opacity="0.8"/>
        <rect x="65" y="95" width="12" height="3" fill="#333" opacity="0.8"/>
        
        <!-- Side panel for number -->
        <rect x="140" y="60" width="25" height="15" rx="3" fill="url(#helmetGradient)" stroke="#333" stroke-width="1"/>
        
        <!-- Rear spoiler extension -->
        <path d="M 170 80 Q 175 85 180 90 Q 185 95 190 100 Q 195 105 200 110" 
              fill="none" stroke="#333" stroke-width="2"/>
        
        <!-- Helmet pattern based on type -->
        ${this.generatePattern(helmetPattern, colors)}
        
        <!-- Helmet number in side panel -->
        <text x="152.5" y="70" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="${colors.accent}">${helmetNumber}</text>
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
      <path d="M 30 70 Q 40 70 50 70 Q 60 70 70 70 Q 80 70 90 70 Q 100 70 110 70 Q 120 70 130 70 Q 140 70 150 70" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 30 85 Q 40 85 50 85 Q 60 85 70 85 Q 80 85 90 85 Q 100 85 110 85 Q 120 85 130 85 Q 140 85 150 85" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 30 100 Q 40 100 50 100 Q 60 100 70 100 Q 80 100 90 100 Q 100 100 110 100 Q 120 100 130 100 Q 140 100 150 100" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
    `;
  }

  /**
   * Generate V-shape converging stripes pattern
   */
  generateVShapeStripes(colors) {
    return `
      <!-- V-shape converging stripes -->
      <path d="M 30 70 Q 45 80 60 70 Q 75 80 90 70 Q 105 80 120 70 Q 135 80 150 70" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 35 85 Q 50 95 65 85 Q 80 95 95 85 Q 110 95 125 85 Q 140 95 155 85" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 40 100 Q 55 110 70 100 Q 85 110 100 100 Q 115 110 130 100 Q 145 110 160 100" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
    `;
  }

  /**
   * Generate zigzag stripes pattern
   */
  generateZigzagStripes(colors) {
    return `
      <!-- Zigzag lines -->
      <path d="M 30 70 L 40 75 L 50 70 L 60 75 L 70 70 L 80 75 L 90 70 L 100 75 L 110 70 L 120 75 L 130 70 L 140 75 L 150 70" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 30 85 L 40 90 L 50 85 L 60 90 L 70 85 L 80 90 L 90 85 L 100 90 L 110 85 L 120 90 L 130 85 L 140 90 L 150 85" 
            stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 30 100 L 40 105 L 50 100 L 60 105 L 70 100 L 80 105 L 90 100 L 100 105 L 110 100 L 120 105 L 130 100 L 140 105 L 150 100" 
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