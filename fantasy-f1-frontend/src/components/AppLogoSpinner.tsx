import React from 'react';

const LOGO_SRC = '/App_Logo.png';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<Size, string> = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

interface AppLogoSpinnerProps {
  /** Preset size. Default: lg */
  size?: Size;
  /** Optional extra class names (e.g. for one-off sizes) */
  className?: string;
}

const AppLogoSpinner: React.FC<AppLogoSpinnerProps> = ({ size = 'lg', className = '' }) => {
  const sizeClass = sizeClasses[size];
  return (
    <img
      src={LOGO_SRC}
      alt="Loading"
      className={`animate-spin ${sizeClass} object-contain ${className}`}
      aria-hidden
    />
  );
};

export default AppLogoSpinner;
