import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess();
  };

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

      {/* Title & Subtitle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '30px 0' }}>
        <h1
          style={{
            fontSize: '34px',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.25,
            letterSpacing: '-0.5px',
          }}
        >
          Make UNSAID
          <br />
          yours.
        </h1>
        <p style={{ fontSize: '16px', color: '#8eb3cb', fontWeight: 500 }}>
          A space for your thoughts.
          <br />
          your way.
        </p>
      </div>

      {/* Form Fields & Submit */}
      <form
        onSubmit={handleSubmit}
        style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {/* Email Field */}
        <div className="input-field-wrapper">
          <Mail size={20} color="#8eb3cb" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password Field */}
        <div className="input-field-wrapper">
          <Lock size={20} color="#8eb3cb" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              background: 'none',
              border: 'none',
              color: '#8eb3cb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Create account button */}
        <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
          Create account
        </button>

        {/* Sign in footer */}
        <p style={{ fontSize: '15px', color: '#ffffff', marginTop: '16px', fontWeight: 500 }}>
          Already have an account?{' '}
          <span
            onClick={onLoginSuccess}
            style={{ color: '#00d8ff', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Sign in
          </span>
        </p>
      </form>
    </motion.div>
  );
};
