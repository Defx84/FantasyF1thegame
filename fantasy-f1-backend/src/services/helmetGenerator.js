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

    // Base helmet shape
    const helmetSVG = `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="helmetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Base helmet shape -->
        <ellipse cx="50" cy="45" rx="35" ry="25" fill="url(#helmetGradient)" stroke="#333" stroke-width="1"/>
        
        <!-- Helmet pattern based on type -->
        ${this.generatePattern(helmetPattern, colors)}
        
        <!-- Helmet number -->
        <text x="50" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${colors.accent}">${helmetNumber}</text>
        
        <!-- Helmet visor -->
        <ellipse cx="50" cy="40" rx="25" ry="8" fill="none" stroke="#333" stroke-width="1" opacity="0.3"/>
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
      <rect x="20" y="35" width="60" height="8" fill="${colors.accent}" opacity="0.8"/>
      <rect x="20" y="45" width="60" height="8" fill="${colors.accent}" opacity="0.8"/>
      <rect x="20" y="55" width="60" height="8" fill="${colors.accent}" opacity="0.8"/>
    `;
  }

  /**
   * Generate V-shape converging stripes pattern
   */
  generateVShapeStripes(colors) {
    return `
      <polygon points="20,35 80,35 70,45 30,45" fill="${colors.accent}" opacity="0.8"/>
      <polygon points="25,45 75,45 65,55 35,55" fill="${colors.accent}" opacity="0.8"/>
      <polygon points="30,55 70,55 60,65 40,65" fill="${colors.accent}" opacity="0.8"/>
    `;
  }

  /**
   * Generate zigzag stripes pattern
   */
  generateZigzagStripes(colors) {
    return `
      <path d="M 20 35 L 30 40 L 40 35 L 50 40 L 60 35 L 70 40 L 80 35" stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 20 45 L 30 50 L 40 45 L 50 50 L 60 45 L 70 50 L 80 45" stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M 20 55 L 30 60 L 40 55 L 50 60 L 60 55 L 70 60 L 80 55" stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
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