import React from 'react';

const OverlayLoader: React.FC = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500 border-solid"></div>
  </div>
);

export default OverlayLoader; 