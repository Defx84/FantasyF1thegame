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
   * @param {number} config.helmetTemplateId - Template type (1, 2, or 3)
   * @param {Object} config.helmetColors - Color configuration
   * @param {string} config.helmetNumber - Number to display on helmet
   * @returns {string} SVG string
   */
  generateHelmetSVG(config) {
    const { helmetTemplateId, helmetColors, helmetNumber } = config;
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
        
        <!-- Helmet pattern based on template -->
        ${this.generatePattern(helmetTemplateId, colors)}
        
        <!-- Helmet number in side panel -->
        <text x="160" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${colors.accent}">${helmetNumber}</text>
      </svg>
    `;

    return helmetSVG;
  }

  /**
   * Generate pattern based on template type
   * @param {number} templateId - Template type (1, 2, or 3)
   * @param {Object} colors - Color configuration
   * @returns {string} SVG pattern elements
   */
  generatePattern(templateId, colors) {
    switch (templateId) {
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
      <ellipse cx="100" cy="75" rx="70" ry="2" fill="${colors.accent}" opacity="0.8"/>
      <ellipse cx="100" cy="90" rx="70" ry="2" fill="${colors.accent}" opacity="0.8"/>
      <ellipse cx="100" cy="105" rx="70" ry="2" fill="${colors.accent}" opacity="0.8"/>
    `;
  }

  /**
   * Generate V-shape converging stripes pattern
   */
  generateVShapeStripes(colors) {
    return `
      <!-- V-shape converging stripes -->
      <ellipse cx="100" cy="75" rx="70" ry="2" fill="${colors.accent}" opacity="0.8" transform="rotate(-15 100 75)"/>
      <ellipse cx="100" cy="90" rx="70" ry="2" fill="${colors.accent}" opacity="0.8" transform="rotate(-10 100 90)"/>
      <ellipse cx="100" cy="105" rx="70" ry="2" fill="${colors.accent}" opacity="0.8" transform="rotate(-5 100 105)"/>
    `;
  }

  /**
   * Generate zigzag stripes pattern
   */
  generateZigzagStripes(colors) {
    return `
      <!-- Zigzag lines -->
      <ellipse cx="100" cy="75" rx="70" ry="2" fill="${colors.accent}" opacity="0.8" transform="rotate(15 100 75)"/>
      <ellipse cx="100" cy="90" rx="70" ry="2" fill="${colors.accent}" opacity="0.8" transform="rotate(-15 100 90)"/>
      <ellipse cx="100" cy="105" rx="70" ry="2" fill="${colors.accent}" opacity="0.8" transform="rotate(15 100 105)"/>
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
      helmetTemplateId: null,
      helmetColors: this.defaultColors,
      helmetNumber: '-',
      isCustomized: false
    };
  }
}

module.exports = new HelmetGenerator(); 