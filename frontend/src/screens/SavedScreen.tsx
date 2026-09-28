import React from 'react';
import { motion } from 'framer-motion';
import { AppHeader } from '../components/AppHeader';

interface SavedScreenProps {
  onMenuClick: () => void;
  onViewThought: () => void;
  onCaptureAnother: () => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({
  onMenuClick,
  onViewThought,
  onCaptureAnother,
}) => {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onMenuClick={onMenuClick} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="screen-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '20px',
          paddingBottom: '30px',
          textAlign: 'center',
        }}
      >
        <div />

        {/* Center Brain Orb */}
        <div style={{ margin: '30px 0' }}>
          <img
            src="/assets/brain_orb.png"
            alt="Brain Orb"
            className="animate-orb"
            style={{ width: '240px', height: '240px', objectFit: 'contain' }}
          />
        </div>

        {/* Title & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h1 style={{ fontSize: '34px', fontWeight: 800, color: '#ffffff' }}>Got it</h1>
          <p style={{ fontSize: '16px', color: '#8eb3cb', fontWeight: 500 }}>
            Your thought has been saved.
          </p>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '30px',
          }}
        >
          <button className="btn-primary" onClick={onViewThought}>
            View Thought
          </button>
          <button className="btn-outline" onClick={onCaptureAnother}>
            Capture Another
          </button>
        </div>
      </motion.div>
    </div>
  );
};
