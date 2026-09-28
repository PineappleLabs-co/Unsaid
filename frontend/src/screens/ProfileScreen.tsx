import React from 'react';
import { motion } from 'framer-motion';
import { Mail, User as UserIcon, LogOut, Pencil } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { UserProfile } from '../types';

interface ProfileScreenProps {
  user: UserProfile;
  onBackClick: () => void;
  onUpgradePlan: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onBackClick,
  onUpgradePlan,
  onLogout,
}) => {
  const isPro = user.plan === 'Pro';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onBackClick={onBackClick} title="Profile" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="screen-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          paddingBottom: '30px',
        }}
      >
        {/* User Avatar with Edit Badge */}
        <div style={{ position: 'relative', marginTop: '10px' }}>
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #00d8ff',
              boxShadow: '0 0 25px rgba(0, 216, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/assets/brain_orb.png"
              alt="Avatar"
              style={{ width: '110px', height: '110px', objectFit: 'contain' }}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#051b2a',
              border: '1.5px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Pencil size={14} />
          </div>
        </div>

        {/* User Name & Email */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff' }}>{user.name}</h2>
          <p style={{ fontSize: '14px', color: '#8eb3cb', marginTop: '2px', fontWeight: 500 }}>
            {user.email}
          </p>
        </div>

        {/* Plan Badge */}
        <button
          onClick={onUpgradePlan}
          style={{
            padding: '8px 24px',
            borderRadius: '24px',
            border: `1.5px solid ${isPro ? '#ffee00' : '#00d8ff'}`,
            background: 'rgba(5, 25, 42, 0.6)',
            color: isPro ? '#ffee00' : '#00d8ff',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: isPro ? '0 0 15px rgba(255, 238, 0, 0.3)' : '0 0 15px rgba(0, 216, 255, 0.2)',
          }}
        >
          {isPro ? 'Pro Plan' : 'Free Plan'}
        </button>

        {/* AI Credits Card matching fre plan profile.png & pro plan profile.png */}
        <div
          className="glass-card"
          style={{
            width: '100%',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'center',
          }}
        >
          <h3
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: isPro ? '#ffee00' : '#00d8ff',
            }}
          >
            AI Credits
          </h3>
          <p style={{ fontSize: '14px', color: '#8eb3cb', fontWeight: 600 }}>
            Used Credits {user.usedCreditsPercent}%
          </p>

          {/* Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${user.usedCreditsPercent}%`,
                backgroundColor: '#ffffff',
                borderRadius: '10px',
              }}
            />
          </div>

          <p style={{ fontSize: '13px', color: '#8eb3cb', fontWeight: 500 }}>Resets in 30 days</p>
        </div>

        {/* User Details Stack */}
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
          {/* Email row */}
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              borderBottom: '1px solid rgba(0, 163, 255, 0.2)',
            }}
          >
            <Mail size={22} color="#8eb3cb" />
            <div>
              <div style={{ fontSize: '14px', color: '#8eb3cb', fontWeight: 500 }}>Email</div>
              <div style={{ fontSize: '16px', color: '#ffffff', fontWeight: 600 }}>{user.email}</div>
            </div>
          </div>

          {/* Username row */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <UserIcon size={22} color="#8eb3cb" />
            <div>
              <div style={{ fontSize: '14px', color: '#8eb3cb', fontWeight: 500 }}>Username</div>
              <div style={{ fontSize: '16px', color: '#ffffff', fontWeight: 600 }}>{user.name}</div>
            </div>
          </div>
        </div>

        {/* Log Out Button */}
        <button
          className="btn-primary"
          onClick={onLogout}
          style={{
            marginTop: 'auto',
            gap: '10px',
          }}
        >
          <LogOut size={20} /> Log Out
        </button>
      </motion.div>
    </div>
  );
};
