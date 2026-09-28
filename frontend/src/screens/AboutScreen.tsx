import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';

interface AboutScreenProps {
  onBackClick: () => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ onBackClick }) => {
  const items = ['Terms of Service', 'Privacy Policy', 'Open Source Licenses'];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onBackClick={onBackClick} title="About" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="screen-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          paddingBottom: '30px',
        }}
      >
        {/* Logo & Version info matching About.png */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            marginTop: '20px',
          }}
        >
          <img
            src="/assets/unsaid_logo.png"
            alt="UNSAID"
            style={{ width: '180px', objectFit: 'contain' }}
          />
          <span style={{ fontSize: '13px', color: '#8eb3cb', fontWeight: 500 }}>
            Thoughts Captured
          </span>
          <span style={{ fontSize: '18px', color: '#ffffff', fontWeight: 700 }}>Version 1.0.0</span>
        </div>

        {/* Card Options Stack */}
        <div
          style={{
            width: '100%',
            background: 'rgba(3, 20, 32, 0.75)',
            border: '1px solid rgba(0, 163, 255, 0.3)',
            borderRadius: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            marginTop: '10px',
          }}
        >
          {items.map((item, idx) => (
            <div
              key={item}
              style={{
                padding: '22px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: idx < items.length - 1 ? '1px solid rgba(0, 163, 255, 0.2)' : 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>{item}</span>
              <ChevronRight size={22} color="#8eb3cb" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
