import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { Thought } from '../types';

interface HistoryScreenProps {
  thoughts: Thought[];
  onBackClick: () => void;
  onSelectThought: (thought: Thought) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  thoughts,
  onBackClick,
  onSelectThought,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThoughts = thoughts.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.transcription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group thoughts by date
  const grouped = filteredThoughts.reduce<Record<string, Thought[]>>((acc, thought) => {
    const d = thought.date || 'Recent';
    if (!acc[d]) acc[d] = [];
    acc[d].push(thought);
    return acc;
  }, {});

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onBackClick={onBackClick} title="History" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="screen-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          paddingBottom: '30px',
        }}
      >
        {/* Search Input Bar matching History.png */}
        <div
          style={{
            width: '100%',
            height: '52px',
            backgroundColor: 'rgba(3, 20, 32, 0.85)',
            border: '1px solid rgba(0, 163, 255, 0.3)',
            borderRadius: '26px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: '12px',
          }}
        >
          <Search size={20} color="#8eb3cb" />
          <input
            type="text"
            placeholder="Search your thought..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '16px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Grouped List by Date */}
        {Object.keys(grouped).length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#8eb3cb',
              marginTop: '40px',
              fontSize: '16px',
            }}
          >
            No thoughts found matching "{searchQuery}"
          </div>
        ) : (
          Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>
                {dateLabel}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {items.map((thought) => (
                  <div
                    key={thought.id}
                    onClick={() => onSelectThought(thought)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      cursor: 'pointer',
                      padding: '4px 0',
                    }}
                  >
                    <img
                      src="/assets/brain_orb.png"
                      alt="Orb"
                      style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          fontSize: '18px',
                          fontWeight: 700,
                          color: '#ffffff',
                          lineHeight: 1.25,
                        }}
                      >
                        {thought.title}
                      </h4>
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#8eb3cb',
                          marginTop: '2px',
                          fontWeight: 500,
                        }}
                      >
                        {thought.formattedTime} . {thought.category}
                      </p>
                    </div>
                    <ChevronRight size={22} color="#8eb3cb" />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </motion.div>
    </div>
  );
};
