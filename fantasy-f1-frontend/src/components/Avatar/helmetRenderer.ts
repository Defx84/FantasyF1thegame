import { HelmetColors } from '../../services/avatarService';
import { helmetTemplates, getHelmetTemplate } from './helmetTemplates';

export interface HelmetConfig {
  helmetTemplateId: number;
  helmetColors: HelmetColors;
  helmetNumber: string;
  size?: number;
}

export class HelmetRenderer {
  /**
   * Generate helmet SVG with custom colors, patterns, and number
   */
  generateHelmetSVG(config: HelmetConfig): string {
    const { helmetTemplateId, helmetColors, helmetNumber, size = 200 } = config;
    
    // Get the selected template
    const template = getHelmetTemplate(helmetTemplateId);
    if (!template) {
      throw new Error(`Helmet template ${helmetTemplateId} not found`);
    }
    
    // Apply colors to the template
    let svg = this.applyColors(template.svg, helmetColors);
    
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
    // Replace CSS variables with actual colors
    svg = svg.replace(/var\(--primary-color\)/g, colors.primary);
    svg = svg.replace(/var\(--secondary-color\)/g, colors.secondary);
    svg = svg.replace(/var\(--accent-color\)/g, colors.accent);
    
    return svg;
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