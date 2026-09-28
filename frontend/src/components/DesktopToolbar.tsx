import React from 'react';
import { Smartphone, Monitor, ShieldAlert } from 'lucide-react';

interface DesktopToolbarProps {
  currentFrame: 'iphone15' | 'iphonese' | 'fullscreen';
  setFrame: (frame: 'iphone15' | 'iphonese' | 'fullscreen') => void;
  resetApp: () => void;
}

export const DesktopToolbar: React.FC<DesktopToolbarProps> = ({
  currentFrame,
  setFrame,
  resetApp,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(5, 18, 29, 0.9)',
        padding: '6px 12px',
        borderRadius: '24px',
        border: '1px solid rgba(0, 180, 255, 0.3)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#8eb3cb', marginRight: '4px' }}>
        Device Frame:
      </span>

      <button
        onClick={() => setFrame('iphone15')}
        style={{
          background: currentFrame === 'iphone15' ? '#00d8ff' : 'transparent',
          color: currentFrame === 'iphone15' ? '#000000' : '#ffffff',
          border: 'none',
          padding: '4px 10px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Smartphone size={14} /> iPhone 15 Pro
      </button>

      <button
        onClick={() => setFrame('iphonese')}
        style={{
          background: currentFrame === 'iphonese' ? '#00d8ff' : 'transparent',
          color: currentFrame === 'iphonese' ? '#000000' : '#ffffff',
          border: 'none',
          padding: '4px 10px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Small Phone
      </button>

      <button
        onClick={() => setFrame('fullscreen')}
        style={{
          background: currentFrame === 'fullscreen' ? '#00d8ff' : 'transparent',
          color: currentFrame === 'fullscreen' ? '#000000' : '#ffffff',
          border: 'none',
          padding: '4px 10px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Monitor size={14} /> Full View
      </button>

      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />

      <button
        onClick={resetApp}
        style={{
          background: 'rgba(255, 60, 60, 0.2)',
          color: '#ff6b6b',
          border: '1px solid rgba(255, 60, 60, 0.4)',
          padding: '4px 10px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <ShieldAlert size={13} /> Reset App
      </button>
    </div>
  );
};
