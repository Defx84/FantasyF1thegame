import React from 'react';
import AppLogoSpinner from './AppLogoSpinner';

const OverlayLoader: React.FC = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <AppLogoSpinner size="xl" />
  </div>
);

export default OverlayLoader; 