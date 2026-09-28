import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: (user: { email: string; name: string; token: string }) => void;
  onGoogle?: () => Promise<void>;
  onBack?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onGoogle,
  onBack,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
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

  const handleGoogleClick = async () => {
    if (!onGoogle) return;
    setLoadingGoogle(true);
    setErrorMessage(null);
    try {
      await onGoogle();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setLoadingGoogle(false);
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
        paddingTop: '50px',
        paddingBottom: '30px',
        textAlign: 'center',
      }}
    >
      {/* Top Logo */}
      <div>
        <img
          src="/assets/unsaid_logo.png"
          alt="UNSAID"
          style={{ width: '200px', objectFit: 'contain' }}
        />
      </div>

      {/* Title & Subtitle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
        <h1
          style={{
            fontSize: '32px',
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
        <p style={{ fontSize: '15px', color: '#8eb3cb', fontWeight: 500 }}>
          A space for your thoughts, your way.
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            width: '100%',
            marginBottom: '12px',
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 68, 68, 0.15)',
            border: '1px solid rgba(255, 68, 68, 0.4)',
            color: '#ff8a8a',
            fontSize: '13px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Fields & Submit */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {onGoogle && (
          <>
            <button
              type="button"
              className="btn-primary"
              onClick={handleGoogleClick}
              disabled={loading || loadingGoogle}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              {loadingGoogle ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
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
              )}
              {loadingGoogle ? 'Connecting Google Account...' : 'Continue with Google'}
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#5a7d97',
                fontSize: '13px',
              }}
            >
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
              <span>or sign in with email</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
            </div>
          </>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          {/* Email Field */}
          <div className="input-field-wrapper">
            <Mail size={18} color="#8eb3cb" />
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
            <Lock size={18} color="#8eb3cb" />
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
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn-outline"
            disabled={loading || loadingGoogle}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Authenticating...' : 'Sign In / Register with Email'}
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
                marginTop: '4px',
              }}
            >
              ← Back
            </button>
          )}
        </form>
      </div>
    </motion.div>
  );
};
