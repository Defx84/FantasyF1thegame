import React, { useState, useEffect } from 'react';
import { HelmetColors } from '../../services/avatarService';

interface HelmetPreviewProps {
  helmetPattern: number | null;
  helmetColors: HelmetColors;
  helmetNumber: string;
  size?: number;
  className?: string;
}

const HelmetPreview: React.FC<HelmetPreviewProps> = ({ 
  helmetPattern, 
  helmetColors, 
  helmetNumber, 
  size = 120,
  className = '' 
}) => {
  const [svgDataUrl, setSvgDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateHelmetSVG();
  }, [helmetPattern, helmetColors, helmetNumber]);

  const generateHelmetSVG = () => {
    setLoading(true);
    
    // Generate SVG directly in the frontend
    const svg = createHelmetSVG();
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
    setSvgDataUrl(dataUrl);
    setLoading(false);
  };

  const createHelmetSVG = (): string => {
    const colors = {
      primary: helmetColors?.primary || '#808080',
      secondary: helmetColors?.secondary || '#808080',
      accent: helmetColors?.accent || '#808080'
    };

    const pattern = helmetPattern || null;
    const number = helmetNumber || '-';

    // Professional F1-style helmet design
    let helmetSVG = `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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
        
        <!-- Main helmet body - more realistic shape -->
        <path d="M 15 35 Q 15 25 25 20 Q 35 15 50 15 Q 65 15 75 20 Q 85 25 85 35 Q 85 45 80 50 Q 75 55 70 60 Q 65 65 50 65 Q 35 65 30 60 Q 25 55 20 50 Q 15 45 15 35 Z" 
              fill="url(#helmetGradient)" stroke="#333" stroke-width="1"/>
        
        <!-- Top stripe/band -->
        <path d="M 15 35 Q 15 25 25 20 Q 35 15 50 15 Q 65 15 75 20 Q 85 25 85 35" 
              fill="none" stroke="#555" stroke-width="3" opacity="0.7"/>
        
        <!-- Visor - more realistic shape -->
        <path d="M 20 35 Q 20 30 25 28 Q 30 26 50 26 Q 70 26 75 28 Q 80 30 80 35 Q 80 40 75 42 Q 70 44 50 44 Q 30 44 25 42 Q 20 40 20 35 Z" 
              fill="url(#visorGradient)" stroke="#333" stroke-width="1"/>
        
        <!-- Visor pivot mechanism -->
        <circle cx="75" cy="35" r="3" fill="#333" stroke="#666" stroke-width="0.5"/>
        <circle cx="75" cy="35" r="1.5" fill="#666"/>
        
        <!-- Chin vents -->
        <rect x="30" y="55" width="8" height="2" fill="#333" opacity="0.8"/>
        <rect x="45" y="55" width="8" height="2" fill="#333" opacity="0.8"/>
        
        <!-- Side panel for number -->
        <rect x="65" y="25" width="12" height="8" rx="2" fill="${colors.primary}" stroke="#333" stroke-width="0.5"/>
        
        <!-- Helmet pattern based on type -->
        ${generatePattern(pattern, colors)}
        
        <!-- Helmet number in side panel -->
        <text x="71" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="6" font-weight="bold" fill="${colors.accent}">${number}</text>
      </svg>
    `;

    return helmetSVG;
  };

  const generatePattern = (patternType: number | null, colors: any): string => {
    switch (patternType) {
      case 1:
        return `
          <!-- Horizontal stripes -->
          <path d="M 20 35 Q 25 35 30 35 Q 35 35 40 35 Q 45 35 50 35 Q 55 35 60 35 Q 65 35 70 35 Q 75 35 80 35" stroke="${colors.accent}" stroke-width="3" fill="none" opacity="0.8"/>
          <path d="M 20 45 Q 25 45 30 45 Q 35 45 40 45 Q 45 45 50 45 Q 55 45 60 45 Q 65 45 70 45 Q 75 45 80 45" stroke="${colors.accent}" stroke-width="3" fill="none" opacity="0.8"/>
          <path d="M 20 55 Q 25 55 30 55 Q 35 55 40 55 Q 45 55 50 55 Q 55 55 60 55 Q 65 55 70 55 Q 75 55 80 55" stroke="${colors.accent}" stroke-width="3" fill="none" opacity="0.8"/>
        `;
      case 2:
        return `
          <!-- V-shape converging stripes -->
          <path d="M 20 35 Q 30 40 40 35 Q 50 40 60 35 Q 70 40 80 35" stroke="${colors.accent}" stroke-width="3" fill="none" opacity="0.8"/>
          <path d="M 25 45 Q 35 50 45 45 Q 55 50 65 45 Q 75 50 85 45" stroke="${colors.accent}" stroke-width="3" fill="none" opacity="0.8"/>
          <path d="M 30 55 Q 40 60 50 55 Q 60 60 70 55 Q 80 60 90 55" stroke="${colors.accent}" stroke-width="3" fill="none" opacity="0.8"/>
        `;
      case 3:
        return `
          <!-- Zigzag lines -->
          <path d="M 20 35 L 30 40 L 40 35 L 50 40 L 60 35 L 70 40 L 80 35" stroke="${colors.accent}" stroke-width="3" fill="none" opacity="0.8"/>
          <path d="M 20 45 L 30 50 L 40 45 L 50 50 L 60 45 L 70 50 L 80 45" stroke="${colors.accent}" stroke-width="3" fill="none" opacity="0.8"/>
          <path d="M 20 55 L 30 60 L 40 55 L 50 60 L 60 55 L 70 60 L 80 55" stroke="${colors.accent}" stroke-width="3" fill="none" opacity="0.8"/>
        `;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div 
        className={`bg-gray-300 rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <img
        src={svgDataUrl || ''}
        alt="Helmet preview"
        style={{ width: size, height: size }}
        className="rounded-full border-2 border-gray-300"
      />
    </div>
  );
};

export default HelmetPreview; 