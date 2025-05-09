import React from 'react';
import { IconType } from 'react-icons';

interface IconWrapperProps {
  icon: IconType;
  size?: number;
  className?: string;
}

const IconWrapper: React.FC<IconWrapperProps> = ({ icon: Icon, size = 24, className = '' }) => {
  if (!Icon) return null;

  const TypedIcon = Icon as unknown as React.FC<{ size?: number; className?: string }>;

  return <TypedIcon size={size} className={className} />;
};

export default IconWrapper; 