import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';

interface ProPlanModalProps {
  onBackClick: () => void;
  onContinue: (plan: 'Free' | 'Pro') => void;
}

export const ProPlanModal: React.FC<ProPlanModalProps> = ({
  onBackClick,
  onContinue,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'Free' | 'Pro'>('Pro');

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onBackClick={onBackClick} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="screen-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '30px',
        }}
      >
        {/* Brain Orb Artwork */}
        <div style={{ margin: '10px 0' }}>
          <img
            src="/assets/brain_orb.png"
            alt="Brain Orb"
            className="animate-orb"
            style={{ width: '150px', height: '150px', objectFit: 'contain' }}
          />
        </div>

        {/* Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', lineHeight: 1.25 }}>
            Go Further With Our <span style={{ color: '#00d8ff' }}>Pro</span> Plan
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#8eb3cb',
              marginTop: '6px',
              fontWeight: 500,
              padding: '0 20px',
            }}
          >
            Turn your thoughts into detailed plans, document and insights.
          </p>
        </div>

        {/* Toggle Pills: Monthly vs Yearly */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            width: '100%',
          }}
        >
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              flex: 1,
              height: '46px',
              borderRadius: '24px',
              backgroundColor: billingCycle === 'monthly' ? '#ffffff' : 'rgba(5, 20, 32, 0.6)',
              color: billingCycle === 'monthly' ? '#000000' : '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Monthly
          </button>

          <button
            onClick={() => setBillingCycle('yearly')}
            style={{
              flex: 1.2,
              height: '46px',
              borderRadius: '24px',
              backgroundColor: billingCycle === 'yearly' ? '#ffffff' : 'rgba(5, 20, 32, 0.6)',
              color: billingCycle === 'yearly' ? '#000000' : '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            Yearly <span style={{ color: '#ffee00', fontWeight: 800 }}>Save 40%</span>
          </button>
        </div>

        {/* Plans Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            width: '100%',
            marginBottom: '24px',
          }}
        >
          {/* Free Card */}
          <div
            onClick={() => setSelectedPlan('Free')}
            style={{
              background: 'rgba(3, 16, 26, 0.8)',
              border: `1px solid ${selectedPlan === 'Free' ? '#00d8ff' : 'rgba(0, 163, 255, 0.3)'}`,
              borderRadius: '20px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>Free</h3>
            <p style={{ fontSize: '11px', color: '#8eb3cb', margin: '4px 0 12px 0' }}>
              2 AI Credits / Month
            </p>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
              ₹0
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#8eb3cb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} color="#8eb3cb" /> Basic Capture
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} color="#8eb3cb" /> AI Organize
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} color="#8eb3cb" /> 2 Detailed Plans
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} color="#8eb3cb" /> All Core Features
              </div>
            </div>
          </div>

          {/* Pro Card */}
          <div
            onClick={() => setSelectedPlan('Pro')}
            style={{
              background: 'rgba(3, 25, 42, 0.9)',
              border: `1.5px solid ${selectedPlan === 'Pro' ? '#00d8ff' : 'rgba(0, 163, 255, 0.3)'}`,
              borderRadius: '20px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              boxShadow: selectedPlan === 'Pro' ? '0 0 20px rgba(0, 216, 255, 0.25)' : 'none',
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>Pro</h3>
            <p style={{ fontSize: '11px', color: '#8eb3cb', margin: '4px 0 12px 0' }}>
              50 AI Credits / Month
            </p>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
              {billingCycle === 'monthly' ? '₹299' : '₹179'} <span style={{ fontSize: '13px', fontWeight: 500, color: '#8eb3cb' }}>/month</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#8eb3cb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} color="#00d8ff" /> All Features
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} color="#00d8ff" /> 50 Detailed Plans
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} color="#00d8ff" /> Advanced AI Models
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} color="#00d8ff" /> Export in PDF/Docs
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} color="#00d8ff" /> Priority Support
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button className="btn-primary" onClick={() => onContinue(selectedPlan)}>
          Continue
        </button>
      </motion.div>
    </div>
  );
};
