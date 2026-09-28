import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Trash2, UserX, ChevronRight } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';

interface PrivacyScreenProps {
  onBackClick: () => void;
  onDeleteAllThoughts: () => void;
}

export const PrivacyScreen: React.FC<PrivacyScreenProps> = ({
  onBackClick,
  onDeleteAllThoughts,
}) => {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onBackClick={onBackClick} title="Privacy and Data" />

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
        {/* Logo & Version info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            marginTop: '10px',
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

        {/* Privacy options stack matching privacy and data.png */}
        <div
          style={{
            width: '100%',
            background: 'rgba(3, 20, 32, 0.75)',
            border: '1px solid rgba(0, 163, 255, 0.3)',
            borderRadius: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Audio Retention */}
          <div
            style={{
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              borderBottom: '1px solid rgba(0, 163, 255, 0.2)',
              cursor: 'pointer',
            }}
          >
            <Mic size={24} color="#ffffff" />
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Audio Retention</h4>
              <p style={{ fontSize: '13px', color: '#8eb3cb', marginTop: '2px', fontWeight: 500 }}>
                Keep it for 30 days
              </p>
            </div>
            <ChevronRight size={20} color="#8eb3cb" />
          </div>

          {/* Delete All Thoughts */}
          <div
            onClick={onDeleteAllThoughts}
            style={{
              padding: '22px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              borderBottom: '1px solid rgba(0, 163, 255, 0.2)',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={24} color="#ffffff" />
            <span style={{ flex: 1, fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
              Delete All Thoughts
            </span>
            <ChevronRight size={20} color="#8eb3cb" />
          </div>

          {/* Delete Account */}
          <div
            style={{
              padding: '22px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              cursor: 'pointer',
            }}
          >
            <UserX size={24} color="#ffffff" />
            <span style={{ flex: 1, fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
              Delete Account
            </span>
            <ChevronRight size={20} color="#8eb3cb" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
