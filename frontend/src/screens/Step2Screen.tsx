import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Step2ScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const Step2Screen: React.FC<Step2ScreenProps> = ({ onNext, onBack }) => {
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
      {/* Top Text */}
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
          Say it.
          <br />
          Don’t type it.
        </h1>
        <p style={{ fontSize: '16px', color: '#8eb3cb', fontWeight: 500 }}>
          Talk naturally we will capture it
        </p>
      </div>

      {/* Center Artwork */}
      <div style={{ width: '100%', position: 'relative', margin: '30px 0' }}>
        <img
          src="/assets/step2_wave.png"
          alt="Soundwave Orb"
          className="animate-wave"
          style={{ width: '100%', height: '180px', objectFit: 'contain' }}
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
        {/* Pagination & Arrows */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <button
            onClick={onBack}
            style={{
              position: 'absolute',
              left: '10px',
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
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
