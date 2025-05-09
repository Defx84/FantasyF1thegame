import React from 'react';
import { IconType } from 'react-icons';

interface IconWrapperProps {
  icon: IconType;
  size?: number;
  className?: string;
}

const IconWrapper: React.FC<IconWrapperProps> = ({ icon: Icon, size = 24, className = '' }) => {
  if (!Icon) return null; // safe guard

  const TypedIcon = Icon as unknown as React.FC<{ size?: number; className?: string }>; // ✅ cast here

  return (
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <TypedIcon size={size} className={`text-gray-400 ${className}`} /> {/* ✅ use casted TypedIcon */}
    </div>
  );
};

export default IconWrapper;
