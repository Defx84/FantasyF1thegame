import React from 'react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`w-full py-3 px-4 border-t border-white/10 bg-black/20 backdrop-blur-sm ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center text-white/60 leading-relaxed">
          <p className="mb-1 text-xs">
            © {currentYear} TheFantasyF1game. All rights reserved.
          </p>
          <p className="text-white/50 text-xs sm:text-xs">
            All content, data, graphics, and intellectual property displayed on this platform are the exclusive property of TheFantasyF1game and its owners. 
            Unauthorized use, reproduction, distribution, or modification of any content is strictly prohibited without express written permission. 
            This includes but is not limited to helmet designs, user interfaces, race data, and statistical information.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
