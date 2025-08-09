import React from 'react';

interface CallingCardProps {
  helmetPresetId: number;
  helmetNumber: string;
  size?: number;
  className?: string;
}

const CallingCard: React.FC<CallingCardProps> = ({
  helmetPresetId,
  helmetNumber,
  size = 200,
  className = ''
}) => {
  const helmetImageUrl = `/images/helmets/preset-${helmetPresetId.toString().padStart(2, '0')}.png`;
  
  // For small sizes (like in lists), use a square aspect ratio
  const isSmall = size <= 60;
  const cardHeight = isSmall ? size : size * 0.8;
  const padding = isSmall ? 2 : 4;
  const badgeSize = isSmall ? 16 : 32;

  return (
    <div 
      className={`relative inline-block ${className}`}
      style={{ width: size, height: cardHeight }}
    >
      {/* Card Background */}
      <div 
        className="w-full h-full rounded-lg border border-gray-300/50 bg-gradient-to-br from-gray-50/20 to-gray-100/20 shadow-sm backdrop-blur-sm"
        style={{ width: size, height: cardHeight }}
      >
        {/* Helmet Image */}
        <div className="flex items-center justify-center h-full" style={{ padding: `${padding}px` }}>
          <img
            src={helmetImageUrl}
            alt={`Helmet Preset ${helmetPresetId}`}
            className="max-w-full max-h-full object-contain"
            style={{ 
              maxWidth: isSmall ? size * 0.8 : size * 0.7, 
              maxHeight: isSmall ? cardHeight * 0.8 : cardHeight * 0.6 
            }}
            onError={(e) => {
              // Fallback if image doesn't load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `
                <div class="flex items-center justify-center w-full h-full text-gray-400">
                  <div class="text-center">
                    <div class="text-xl ${isSmall ? 'text-sm' : 'text-2xl'} mb-1">🏁</div>
                    <div class="text-xs ${isSmall ? 'text-xs' : 'text-sm'}">H${helmetPresetId}</div>
                  </div>
                </div>
              `;
            }}
          />
        </div>
        
        {/* Number Badge */}
        {helmetNumber && helmetNumber !== '-' && (
          <div className="absolute bottom-1 right-1" style={{ bottom: isSmall ? '2px' : '8px', right: isSmall ? '2px' : '8px' }}>
            <div 
              className="bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-md"
              style={{ 
                width: badgeSize, 
                height: badgeSize, 
                fontSize: isSmall ? '10px' : '12px' 
              }}
            >
              {helmetNumber}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallingCard;
