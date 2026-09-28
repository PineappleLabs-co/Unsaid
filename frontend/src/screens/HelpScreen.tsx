import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';

interface HelpScreenProps {
  onBackClick: () => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ onBackClick }) => {
  const faqs = [
    'How does voice capture work?',
    'How does AI organize thoughts?',
    'Where are my thoughts stored?',
    'Can I use UNSAID without an account?',
    'How do I delete my data?',
    'Contact support',
  ];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onBackClick={onBackClick} title="Help and Support" />

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

        {/* FAQ Stack Card matching help and support.png */}
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
          {faqs.map((faq, idx) => (
            <div
              key={faq}
              style={{
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: idx < faqs.length - 1 ? '1px solid rgba(0, 163, 255, 0.2)' : 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', paddingRight: '12px' }}>
                {faq}
              </span>
              <ChevronRight size={20} color="#8eb3cb" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
