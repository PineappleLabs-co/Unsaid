import React from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onGetStarted: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="screen-content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '60px',
        paddingBottom: '30px',
        textAlign: 'center',
      }}
    >
      {/* Top Logo */}
      <div style={{ marginTop: '20px' }}>
        <img
          src="/assets/unsaid_logo.png"
          alt="UNSAID"
          style={{ width: '220px', objectFit: 'contain' }}
        />
      </div>

      {/* Center Brain Orb */}
      <div style={{ position: 'relative', margin: '40px 0' }}>
        <img
          src="/assets/brain_orb.png"
          alt="Brain Orb"
          className="animate-orb"
          style={{ width: '240px', height: '240px', objectFit: 'contain' }}
        />
      </div>

      {/* Bottom Text & Button */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 600,
            color: '#ffffff',
            lineHeight: 1.4,
            padding: '0 20px',
          }}
        >
          Had a thought?
          <br />
          Capture it before it disappears.
        </h2>

        <button className="btn-primary" onClick={onGetStarted}>
          Get Started
        </button>
      </div>
    </motion.div>
  );
};
