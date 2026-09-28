import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: (user: { email: string; name: string; token: string }) => void;
  onBack?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.loginWithEmail(email, password);
      onLoginSuccess({
        email: res.email,
        name: email.split('@')[0],
        token: res.token,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
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

        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 68, 68, 0.15)',
              border: '1px solid rgba(255, 68, 68, 0.4)',
              color: '#ff6b6b',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Authenticating...' : 'Sign In / Create Account'}
        </button>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#8eb3cb',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            ← Back
          </button>
        )}
      </form>
    </motion.div>
  );
};
