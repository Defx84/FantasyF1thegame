import React from 'react';

interface CardImageProps {
  cardName: string;
  cardType: 'driver' | 'team';
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * CardImage component - Displays card images with uniform sizing
 * 
 * Images should be placed in: public/cards/{driver|team}/{cardName}.png
 * 
 * Features:
 * - Uniform sizing regardless of source image dimensions
 * - Maintains aspect ratio with object-fit: cover
 * - Responsive sizing options
 */
const CardImage: React.FC<CardImageProps> = ({ 
  cardName, 
  cardType, 
  className = '', 
  size = 'medium' 
}) => {
  // Size presets
  const sizeClasses = {
    small: 'w-16 h-24',      // 64x96px (2.5:3.75 ratio)
    medium: 'w-32 h-48',     // 128x192px (2:3 ratio)
    large: 'w-48 h-72'       // 192x288px (2:3 ratio)
  };

  // Normalize card name for file path (remove special characters, lowercase, replace spaces with hyphens)
  const normalizedName = cardName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const imagePath = `/cards/${cardType}/${normalizedName}.png`;

  return (
    <div className={`${sizeClasses[size]} ${className} relative overflow-hidden rounded-lg`}>
      <img
        src={imagePath}
        alt={cardName}
        className="w-full h-full object-cover object-center"
        onError={(e) => {
          // Fallback to placeholder if image doesn't exist
          const target = e.target as HTMLImageElement;
          target.src = '/cards/placeholder.png';
          target.onerror = null; // Prevent infinite loop
        }}
      />
    </div>
  );
};

export default CardImage;

