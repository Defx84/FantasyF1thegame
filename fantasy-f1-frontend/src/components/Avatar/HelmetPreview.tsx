import React, { useState, useEffect } from 'react';
import { HelmetColors } from '../../services/avatarService';
import { helmetRenderer, HelmetConfig } from './helmetRenderer';

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
  const [rawSvg, setRawSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateHelmetSVG();
  }, [helmetPattern, helmetColors, helmetNumber, size]);

  const generateHelmetSVG = () => {
    setLoading(true);
    
    try {
      // Use the new helmet renderer
      const config: HelmetConfig = {
        helmetPattern,
        helmetColors,
        helmetNumber: helmetNumber || '-',
        size
      };
      
      // Temporarily use test helmet for debugging
      const svg = helmetRenderer.generateTestHelmet();
      console.log('Generated Test SVG:', svg); // Debug log
      setRawSvg(svg);
      
      const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
      setSvgDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating helmet SVG:', error);
    } finally {
      setLoading(false);
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

  // Debug: Show raw SVG for troubleshooting
  if (rawSvg) {
    return (
      <div className={`inline-block ${className}`}>
        <div 
          dangerouslySetInnerHTML={{ __html: rawSvg }}
          style={{ width: size, height: size * 0.8 }}
          className="border-2 border-gray-300 rounded-lg"
        />
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <img
        src={svgDataUrl || ''}
        alt="Helmet preview"
        style={{ width: size, height: size * 0.8 }} // Maintain aspect ratio for side profile
        className="border-2 border-gray-300 rounded-lg"
      />
    </div>
  );
};

export default HelmetPreview; 