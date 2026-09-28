import React from 'react';
import { motion } from 'framer-motion';

interface MicrophoneScreenProps {
  onAllowMicrophone: () => void;
  onNext: () => void;
}

export const MicrophoneScreen: React.FC<MicrophoneScreenProps> = ({
  onAllowMicrophone,
  onNext,
}) => {
  const handleAllow = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (e) {
      console.log('Mic permission info:', e);
    }
    onAllowMicrophone();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
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
      {/* Title & Subtitle */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.25,
            letterSpacing: '-0.5px',
          }}
        >
          Give your
          <br />
          thoughts a voice.
        </h1>
        <p style={{ fontSize: '16px', color: '#8eb3cb', fontWeight: 500 }}>
          Allow microphone access
          <br />
          to capture thoughts hassle free
        </p>
      </div>

      {/* Center Microphone Artwork */}
      <div style={{ position: 'relative', margin: '20px 0' }}>
        <img
          src="/assets/mic_orb.png"
          alt="Microphone Orb"
          className="animate-orb"
          style={{ width: '250px', height: '250px', objectFit: 'contain' }}
        />
      </div>

      {/* Buttons */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'center',
        }}
      >
        <button className="btn-primary" onClick={handleAllow}>
          Allow Microphone
        </button>

        <button
          onClick={onNext}
          style={{
            background: 'none',
            border: 'none',
            color: '#8eb3cb',
            fontSize: '17px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Next
        </button>
      </div>
    </motion.div>
  );
};
