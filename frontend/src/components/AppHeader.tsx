import React from 'react';
import { Menu, ChevronLeft } from 'lucide-react';

interface AppHeaderProps {
  onMenuClick?: () => void;
  onBackClick?: () => void;
  title?: string;
  showLogo?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onMenuClick,
  onBackClick,
  title,
  showLogo = true,
}) => {
  return (
    <div className="app-header">
      {onBackClick ? (
        <button className="app-header-btn" onClick={onBackClick} aria-label="Go Back">
          <ChevronLeft size={28} strokeWidth={2.5} color="#ffffff" />
        </button>
      ) : onMenuClick ? (
        <button className="app-header-btn" onClick={onMenuClick} aria-label="Open Menu">
          <Menu size={26} strokeWidth={2} color="#ffffff" />
        </button>
      ) : (
        <div style={{ width: 40 }} />
      )}

      {title ? (
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px' }}>
          {title}
        </h1>
      ) : showLogo ? (
        <img
          src="/assets/unsaid_logo.png"
          alt="UNSAID"
          style={{ height: '24px', objectFit: 'contain' }}
        />
      ) : (
        <div />
      )}

      <div style={{ width: 40 }} />
    </div>
  );
};
