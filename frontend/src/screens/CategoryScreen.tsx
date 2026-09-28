import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  BookOpen,
  Briefcase,
  User,
  Heart,
  TrendingUp,
  Palette,
  Code,
  MoreHorizontal,
} from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { CategoryId } from '../types';

interface CategoryScreenProps {
  onMenuClick: () => void;
  onSelectCategory: (category: CategoryId) => void;
}

export const CategoryScreen: React.FC<CategoryScreenProps> = ({
  onMenuClick,
  onSelectCategory,
}) => {
  const [selected, setSelected] = useState<CategoryId>('Idea');
  const [selectedTag, setSelectedTag] = useState<string>('Product Idea');

  const categories: { id: CategoryId; label: string; icon: React.ReactNode }[] = [
    { id: 'Idea', label: 'Idea', icon: <Lightbulb size={28} color="#00d8ff" /> },
    { id: 'Study', label: 'Study', icon: <BookOpen size={28} color="#00d8ff" /> },
    { id: 'Work', label: 'Work', icon: <Briefcase size={28} color="#00d8ff" /> },
    { id: 'Personal', label: 'Personal', icon: <User size={28} color="#00d8ff" /> },
    { id: 'Health', label: 'Health', icon: <Heart size={28} color="#00d8ff" /> },
    { id: 'Finance', label: 'Finance', icon: <TrendingUp size={28} color="#00d8ff" /> },
    { id: 'Creative', label: 'Creative', icon: <Palette size={28} color="#00d8ff" /> },
    { id: 'Tech', label: 'Tech', icon: <Code size={28} color="#00d8ff" /> },
    { id: 'Others', label: 'Others', icon: <MoreHorizontal size={28} color="#00d8ff" /> },
  ];

  const aiSuggestions = ['Product Idea', 'App Development', 'UI/UX'];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onMenuClick={onMenuClick} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="screen-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingBottom: '30px',
        }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center', margin: '10px 0 20px 0' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#ffffff' }}>What’s this about?</h1>
          <p style={{ fontSize: '15px', color: '#8eb3cb', marginTop: '6px', fontWeight: 500 }}>
            Choose your theme or let AI Suggest.
          </p>
        </div>

        {/* 3x3 Category Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          {categories.map((cat) => {
            const isActive = selected === cat.id;
            return (
              <div
                key={cat.id}
                className={`category-tile ${isActive ? 'active' : ''}`}
                onClick={() => setSelected(cat.id)}
              >
                {cat.icon}
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: isActive ? '#ffffff' : '#b0cee0',
                  }}
                >
                  {cat.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* AI Suggestion */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#8eb3cb', marginBottom: '12px' }}>
            AI Suggestion
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {aiSuggestions.map((tag) => {
              const isTagActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  style={{
                    background: isTagActive ? 'rgba(0, 180, 255, 0.25)' : 'rgba(8, 30, 48, 0.7)',
                    border: `1px solid ${isTagActive ? '#00d8ff' : 'rgba(0, 163, 255, 0.3)'}`,
                    color: isTagActive ? '#00d8ff' : '#8eb3cb',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue Button */}
        <button
          className="btn-primary"
          onClick={() => onSelectCategory(selected)}
          style={{ marginTop: 'auto' }}
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
};
