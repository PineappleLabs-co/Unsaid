import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface Step1ScreenProps {
  onNext: () => void;
}

export const Step1Screen: React.FC<Step1ScreenProps> = ({ onNext }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
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
      {/* Top Header Text */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.2,
            letterSpacing: '-0.5px',
          }}
        >
          Some thoughts
          <br />
          don’t wait.
        </h1>
        <p style={{ fontSize: '16px', color: '#8eb3cb', fontWeight: 500 }}>
          Capture them the moment they
          <br />
          appear.
        </p>
      </div>

      {/* Center Artwork */}
      <div style={{ position: 'relative', margin: '20px 0' }}>
        <img
          src="/assets/step1_shards.png"
          alt="Shards Artwork"
          className="animate-orb"
          style={{ width: '270px', height: '270px', objectFit: 'contain' }}
        />
      </div>

      {/* Bottom Controls */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          alignItems: 'center',
        }}
      >
        {/* Pagination Dots & Navigation Arrow */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
              }}
            />
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.6)',
              }}
            />
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.6)',
              }}
            />
          </div>

          <button
            onClick={onNext}
            style={{
              position: 'absolute',
              right: '10px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: 'none',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255,255,255,0.2)',
            }}
          >
            <ArrowRight size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Primary Next Button */}
        <button className="btn-primary" onClick={onNext}>
          Next
        </button>
      </div>
    </motion.div>
  );
};
