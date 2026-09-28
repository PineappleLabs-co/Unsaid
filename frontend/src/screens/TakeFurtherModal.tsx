import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, CheckSquare, Sparkles } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { Thought } from '../types';

interface TakeFurtherModalProps {
  thought: Thought;
  onBack: () => void;
  onGenerateAI: (option: string) => void;
}

export const TakeFurtherModal: React.FC<TakeFurtherModalProps> = ({
  thought,
  onBack,
  onGenerateAI,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('plan');

  const options = [
    {
      id: 'plan',
      title: 'Create a structured plan',
      subtitle: 'Turn your thoughts into actionable plans',
      icon: <FileText size={24} color="#ffffff" />,
    },
    {
      id: 'research',
      title: 'Research Insights',
      subtitle: 'Get relevant information and context',
      icon: <Search size={24} color="#ffffff" />,
    },
    {
      id: 'features',
      title: 'Suggested Features',
      subtitle: 'Find ideas and improvements',
      icon: <CheckSquare size={24} color="#ffffff" />,
    },
    {
      id: 'summary',
      title: 'Organize and summarize',
      subtitle: 'Make your thoughts clear and complete',
      icon: <Sparkles size={24} color="#ffffff" />,
    },
  ];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onBackClick={onBack} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
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
            style={{ width: '160px', height: '160px', objectFit: 'contain' }}
          />
        </div>

        {/* Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff' }}>
            Take This Thought Further ?
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: '#8eb3cb',
              marginTop: '6px',
              fontWeight: 500,
              padding: '0 20px',
            }}
          >
            Let AI help you expand, organize and turn this into a detailed plan.
          </p>
        </div>

        {/* Options List Container */}
        <div
          style={{
            width: '100%',
            background: 'rgba(3, 20, 32, 0.75)',
            border: '1px solid rgba(0, 163, 255, 0.3)',
            borderRadius: '24px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '20px',
          }}
        >
          {options.map((opt, idx) => {
            const isSelected = selectedOption === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedOption(opt.id)}
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(0, 180, 255, 0.15)' : 'transparent',
                  borderBottom:
                    idx < options.length - 1 ? '1px solid rgba(0, 163, 255, 0.15)' : 'none',
                  transition: 'background 0.15s ease',
                }}
              >
                <div>{opt.icon}</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
                    {opt.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#8eb3cb', marginTop: '2px', fontWeight: 500 }}>
                    {opt.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Generate Button */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button className="btn-primary" onClick={() => onGenerateAI(selectedOption)}>
            Generate with AI <Sparkles size={20} />
          </button>

          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Not now
          </button>
        </div>
      </motion.div>
    </div>
  );
};
