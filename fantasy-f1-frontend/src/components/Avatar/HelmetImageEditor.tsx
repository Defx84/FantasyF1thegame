import React, { useRef, useEffect, useState } from 'react';
import { HelmetColors } from '../../services/avatarService';

export interface HelmetTemplate {
  id: number;
  name: string;
  imageUrl: string;
  description: string;
}

interface HelmetImageEditorProps {
  helmetTemplateId: number;
  helmetColors: HelmetColors;
  helmetNumber: string;
  size?: number;
  className?: string;
  onImageGenerated?: (dataUrl: string) => void;
}

const helmetTemplates: HelmetTemplate[] = [
  {
    id: 1,
    name: "Classic Stripes",
    description: "Three horizontal diagonal stripes",
    imageUrl: "/images/helmets/Template-1.png"
  },
  {
    id: 2,
    name: "V-Shape Design", 
    description: "Three stripes converging in V-shape",
    imageUrl: "/images/helmets/Template-2.png"
  },
  {
    id: 3,
    name: "Zigzag Lightning",
    description: "Three zigzag lightning-like stripes", 
    imageUrl: "/images/helmets/Template-3.png"
  }
];

const HelmetImageEditor: React.FC<HelmetImageEditorProps> = ({
  helmetTemplateId,
  helmetColors,
  helmetNumber,
  size = 200,
  className = '',
  onImageGenerated
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateHelmetImage();
  }, [helmetTemplateId, helmetColors, helmetNumber, size]);

  const generateHelmetImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setError(null);

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas size - make helmet larger
      canvas.width = size;
      canvas.height = size * 0.8; // Maintain aspect ratio

      // Clear canvas with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get the selected template
      const template = helmetTemplates.find(t => t.id === helmetTemplateId);
      if (!template) {
        throw new Error(`Template ${helmetTemplateId} not found`);
      }

      // Load the base helmet template image
      const image = new Image();
      image.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => {
          console.warn(`Failed to load helmet template ${helmetTemplateId}, using fallback`);
          drawPlaceholderHelmet(ctx, canvas.width, canvas.height);
          resolve();
        };
        image.src = template.imageUrl;
      });

      // If image loaded successfully, process it properly
      if (image.complete && image.naturalWidth > 0) {
        // Draw the helmet larger to fill more of the box
        const scale = 1.2; // Make helmet 20% larger
        const scaledWidth = canvas.width * scale;
        const scaledHeight = canvas.height * scale;
        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;
        
        ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);
        
        // Apply color only to the helmet area using masking
        applyColorMask(ctx, canvas.width, canvas.height, scaledWidth, scaledHeight, offsetX, offsetY);
      } else {
        // Fallback to drawn helmet
        drawPlaceholderHelmet(ctx, canvas.width, canvas.height);
      }

      // Add the number
      addNumber(ctx, canvas.width, canvas.height);

      // Generate data URL and call callback
      const dataUrl = canvas.toDataURL('image/png');
      if (onImageGenerated) {
        onImageGenerated(dataUrl);
      }

    } catch (err) {
      console.error('Error generating helmet image:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Fallback: draw a simple placeholder
      drawPlaceholder();
    } finally {
      setIsLoading(false);
    }
  };

  const applyColorMask = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, helmetWidth: number, helmetHeight: number, offsetX: number, offsetY: number) => {
    const { primary } = helmetColors;
    
    // Create a temporary canvas to work with the helmet area
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    
    // Copy the current canvas content to temp canvas
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Create a mask for the helmet area (excluding visor)
    ctx.save();
    
    // Create a path that covers the helmet but excludes the visor area
    ctx.beginPath();
    
    // Main helmet body (elliptical shape)
    const centerX = offsetX + helmetWidth / 2;
    const centerY = offsetY + helmetHeight / 2;
    const radiusX = helmetWidth * 0.4;
    const radiusY = helmetHeight * 0.3;
    
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    
    // Exclude visor area (smaller ellipse)
    const visorRadiusX = radiusX * 0.8;
    const visorRadiusY = radiusY * 0.6;
    const visorCenterY = centerY - radiusY * 0.1;
    
    ctx.moveTo(centerX + visorRadiusX, visorCenterY);
    ctx.ellipse(centerX, visorCenterY, visorRadiusX, visorRadiusY, 0, 0, 2 * Math.PI, true);
    
    // Apply the mask
    ctx.clip();
    
    // Apply color overlay only to the masked area
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = primary + '80'; // 80 = 50% opacity
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  };

  const drawPlaceholderHelmet = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw a professional-looking helmet placeholder
    const { primary, secondary, accent } = helmetColors;
    
    // Create gradient for helmet body
    const helmetGradient = ctx.createLinearGradient(0, 0, width, height);
    helmetGradient.addColorStop(0, primary);
    helmetGradient.addColorStop(1, secondary);
    
    // Main helmet body (ellipse)
    ctx.fillStyle = helmetGradient;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.5, width * 0.4, height * 0.3, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Visor (dark area)
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.45, width * 0.35, height * 0.2, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Visor reflection
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.42, width * 0.3, height * 0.15, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Chin bar
    ctx.fillStyle = helmetGradient;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.7, width * 0.3, height * 0.1, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Side panel for number
    ctx.fillStyle = helmetGradient;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(width * 0.75, height * 0.4, width * 0.15, height * 0.12);
    ctx.fill();
    ctx.stroke();
    
    // Add pattern based on template
    drawPattern(ctx, width, height);
  };
  
  const drawPattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { accent } = helmetColors;
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.8;
    
    switch (helmetTemplateId) {
      case 1: // Horizontal stripes
        for (let i = 0; i < 3; i++) {
          const y = height * (0.3 + i * 0.15);
          ctx.fillRect(width * 0.1, y, width * 0.6, height * 0.02);
        }
        break;
      case 2: // V-shape
        ctx.beginPath();
        ctx.moveTo(width * 0.2, height * 0.25);
        ctx.lineTo(width * 0.5, height * 0.5);
        ctx.lineTo(width * 0.8, height * 0.25);
        ctx.lineWidth = height * 0.03;
        ctx.strokeStyle = accent;
        ctx.stroke();
        break;
      case 3: // Zigzag
        ctx.beginPath();
        ctx.moveTo(width * 0.2, height * 0.3);
        for (let i = 0; i < 4; i++) {
          const x = width * (0.2 + i * 0.2);
          const y1 = height * (0.3 + (i % 2) * 0.1);
          const y2 = height * (0.3 + ((i + 1) % 2) * 0.1);
          ctx.lineTo(x, y1);
          ctx.lineTo(x + width * 0.1, y2);
        }
        ctx.lineWidth = height * 0.02;
        ctx.strokeStyle = accent;
        ctx.stroke();
        break;
    }
    ctx.globalAlpha = 1;
  };

  const addNumber = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!helmetNumber || helmetNumber === '-') return;

    // Calculate helmet position (same as in applyColorMask)
    const scale = 1.2;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    // Template-specific number positioning within the helmet area
    let x, y;
    const helmetCenterX = offsetX + scaledWidth / 2;
    const helmetCenterY = offsetY + scaledHeight / 2;
    
    switch (helmetTemplateId) {
      case 1: // Classic Stripes
        x = helmetCenterX + scaledWidth * 0.25; // Right side of helmet
        y = helmetCenterY - scaledHeight * 0.05;
        break;
      case 2: // V-Shape Design
        x = helmetCenterX + scaledWidth * 0.28;
        y = helmetCenterY - scaledHeight * 0.02;
        break;
      case 3: // Zigzag Lightning
        x = helmetCenterX + scaledWidth * 0.26;
        y = helmetCenterY - scaledHeight * 0.03;
        break;
      default:
        x = helmetCenterX + scaledWidth * 0.25;
        y = helmetCenterY - scaledHeight * 0.05;
    }

    // Set text properties
    const fontSize = Math.max(14, scaledWidth * 0.06);
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#FFFFFF'; // White text for better visibility
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Draw the number
    ctx.fillText(helmetNumber, x, y);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  const drawPlaceholder = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw a simple placeholder helmet
    ctx.fillStyle = '#808080';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    // Main helmet body (ellipse)
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.4, canvas.height * 0.3, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Visor
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.5, canvas.height * 0.45, canvas.width * 0.35, canvas.height * 0.2, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Number
    ctx.fillStyle = '#FFFF00';
    ctx.font = `bold ${Math.max(12, canvas.width * 0.08)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(helmetNumber || '-', canvas.width * 0.8, canvas.height * 0.47);
  };

  if (error) {
    return (
      <div className={`bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded ${className}`}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ 
          width: size, 
          height: size * 0.8,
          border: '2px solid #ccc',
          borderRadius: '8px'
        }}
        className="bg-gray-100"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
        </div>
      )}
    </div>
  );
};

export default HelmetImageEditor;
export { helmetTemplates }; 