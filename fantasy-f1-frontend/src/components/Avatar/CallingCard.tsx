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
  const helmetImageUrl = `/images/helmets/preset-${helmetPresetId}.png`;
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size * 0.8 }}
    >
      {/* Card Background */}
      <div 
        className="w-full h-full rounded-lg border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm"
        style={{ width: size, height: size * 0.8 }}
      >
        {/* Helmet Image */}
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={helmetImageUrl}
            alt={`Helmet Preset ${helmetPresetId}`}
            className="max-w-full max-h-full object-contain"
            style={{ maxWidth: size * 0.7, maxHeight: size * 0.6 }}
            onError={(e) => {
              // Fallback if image doesn't load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `
                <div class="flex items-center justify-center w-full h-full text-gray-400">
                  <div class="text-center">
                    <div class="text-2xl mb-2">🏁</div>
                    <div class="text-sm">Helmet ${helmetPresetId}</div>
                  </div>
                </div>
              `;
            }}
          />
        </div>
        
        {/* Number Badge */}
        {helmetNumber && helmetNumber !== '-' && (
          <div className="absolute bottom-2 right-2">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md">
              {helmetNumber}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallingCard;
