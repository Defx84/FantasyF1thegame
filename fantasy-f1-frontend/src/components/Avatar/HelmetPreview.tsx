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

    // Base helmet shape
    let helmetSVG = `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="helmetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Base helmet shape -->
        <ellipse cx="50" cy="45" rx="35" ry="25" fill="url(#helmetGradient)" stroke="#333" stroke-width="1"/>
        
        <!-- Helmet pattern based on type -->
        ${generatePattern(pattern, colors)}
        
        <!-- Helmet number -->
        <text x="50" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${colors.accent}">${number}</text>
        
        <!-- Helmet visor -->
        <ellipse cx="50" cy="40" rx="25" ry="8" fill="none" stroke="#333" stroke-width="1" opacity="0.3"/>
      </svg>
    `;

    return helmetSVG;
  };

  const generatePattern = (patternType: number | null, colors: any): string => {
    switch (patternType) {
      case 1:
        return `
          <rect x="20" y="35" width="60" height="8" fill="${colors.accent}" opacity="0.8"/>
          <rect x="20" y="45" width="60" height="8" fill="${colors.accent}" opacity="0.8"/>
          <rect x="20" y="55" width="60" height="8" fill="${colors.accent}" opacity="0.8"/>
        `;
      case 2:
        return `
          <polygon points="20,35 80,35 70,45 30,45" fill="${colors.accent}" opacity="0.8"/>
          <polygon points="25,45 75,45 65,55 35,55" fill="${colors.accent}" opacity="0.8"/>
          <polygon points="30,55 70,55 60,65 40,65" fill="${colors.accent}" opacity="0.8"/>
        `;
      case 3:
        return `
          <path d="M 20 35 L 30 40 L 40 35 L 50 40 L 60 35 L 70 40 L 80 35" stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
          <path d="M 20 45 L 30 50 L 40 45 L 50 50 L 60 45 L 70 50 L 80 45" stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
          <path d="M 20 55 L 30 60 L 40 55 L 50 60 L 60 55 L 70 60 L 80 55" stroke="${colors.accent}" stroke-width="4" fill="none" opacity="0.8"/>
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