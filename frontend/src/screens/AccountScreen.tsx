import React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

interface AccountScreenProps {
  onGoogle: () => void;
  onEmail: () => void;
  onGuest: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  onGoogle,
  onEmail,
  onGuest,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
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

      {/* Middle Text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '40px 0' }}>
        <h1
          style={{
            fontSize: '34px',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.25,
            letterSpacing: '-0.5px',
          }}
        >
          Keep your
          <br />
          thoughts close.
        </h1>
        <p style={{ fontSize: '16px', color: '#8eb3cb', fontWeight: 500 }}>
          Sync across devices
          <br />
          and never lose a thought.
        </p>
      </div>

      {/* Bottom Buttons */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Google Button */}
        <button className="btn-primary" onClick={onGoogle}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Email Button */}
        <button className="btn-outline" onClick={onEmail}>
          <Mail size={20} />
          Continue with Email
        </button>

        {/* Or Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '10px 0',
            color: '#5a7d97',
            fontSize: '15px',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <span>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Continue as Guest */}
        <button
          onClick={onGuest}
          style={{
            background: 'none',
            border: 'none',
            color: '#8eb3cb',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '6px',
          }}
        >
          Continue as guest
        </button>
      </div>
    </motion.div>
  );
};
