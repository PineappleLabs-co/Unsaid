import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScreenId } from '../types';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenProPlan: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenProPlan,
}) => {
  const menuItems = [
    { label: 'Capture', action: () => onNavigate('record') },
    { label: 'Notes', action: () => onNavigate('notes') },
    { label: 'AI Credits', action: () => onOpenProPlan() },
    { label: 'Profile', action: () => onNavigate('profile') },

    { label: 'Settings', action: () => onNavigate('privacy') },
    { label: 'Help and Support', action: () => onNavigate('help') },
    { label: 'Privacy and Data', action: () => onNavigate('privacy') },
    { label: 'About', action: () => onNavigate('about') },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 90,
            }}
          />

          {/* Drawer panel matching Menu bar.png */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '65%',
              maxWidth: '280px',
              backgroundColor: '#021827',
              borderRight: '1px solid rgba(0, 180, 255, 0.2)',
              padding: '60px 24px 30px 24px',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 100,
              boxShadow: '10px 0 30px rgba(0, 0, 0, 0.8)',
            }}
          >
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '28px',
                letterSpacing: '-0.5px',
              }}
            >
              Navigate
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94b3c7',
                    fontSize: '18px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'color 0.15s ease',
                    padding: '2px 0',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94b3c7')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
