import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MoreHorizontal, Search, Mic, SquarePen, Cloud, HardDrive } from 'lucide-react';
import { Thought } from '../types';

interface NotesScreenProps {
  notes: Thought[];
  onBackClick: () => void;
  onSelectNote: (note: Thought) => void;
  onNewNote: () => void;
  onMicClick: () => void;
}

interface GroupedNotes {
  title: string;
  items: Thought[];
}

export const NotesScreen: React.FC<NotesScreenProps> = ({
  notes,
  onBackClick,
  onSelectNote,
  onNewNote,
  onMicClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notes by search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.transcription.toLowerCase().includes(q) ||
        (n.summary && n.summary.toLowerCase().includes(q))
    );
  }, [notes, searchQuery]);

  // Group notes chronologically: Previous 7 Days, Previous 30 Days, Months
  const groupedSections = useMemo<GroupedNotes[]>(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const prev7Days: Thought[] = [];
    const prev30Days: Thought[] = [];
    const monthMap: Record<string, Thought[]> = {};

    filteredNotes.forEach((note) => {
      const noteDate = new Date(note.date || Date.now());
      if (isNaN(noteDate.getTime())) {
        prev7Days.push(note);
        return;
      }

      if (noteDate >= sevenDaysAgo) {
        prev7Days.push(note);
      } else if (noteDate >= thirtyDaysAgo) {
        prev30Days.push(note);
      } else {
        const monthName = noteDate.toLocaleDateString('en-US', { month: 'long' });
        if (!monthMap[monthName]) monthMap[monthName] = [];
        monthMap[monthName].push(note);
      }
    });

    const groups: GroupedNotes[] = [];
    if (prev7Days.length > 0) groups.push({ title: 'Previous 7 Days', items: prev7Days });
    if (prev30Days.length > 0) groups.push({ title: 'Previous 30 Days', items: prev30Days });
    Object.keys(monthMap).forEach((month) => {
      groups.push({ title: month, items: monthMap[month] });
    });

    if (groups.length === 0 && filteredNotes.length > 0) {
      groups.push({ title: 'Notes', items: filteredNotes });
    }

    return groups;
  }, [filteredNotes]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000000',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Header matching Apple Notes */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 18px 10px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          onClick={onBackClick}
          style={{
            background: 'none',
            border: 'none',
            color: '#ff9f0a',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#1c1c1e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={22} color="#ffffff" />
          </div>
        </button>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Notes</h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '11px',
              color: '#8e8e93',
              marginTop: '2px',
            }}
          >
            <Cloud size={12} color="#8e8e93" />
            <span>Synced</span>
          </div>
        </div>

        <button
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#1c1c1e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MoreHorizontal size={20} color="#ffffff" />
          </div>
        </button>
      </div>

      {/* Scrollable Grouped Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 18px 90px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {groupedSections.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8e8e93',
              gap: '12px',
              paddingTop: '60px',
            }}
          >
            <SquarePen size={44} strokeWidth={1.5} />
            <p style={{ fontSize: '16px', fontWeight: 500 }}>No Notes Found</p>
            <button
              onClick={onNewNote}
              style={{
                backgroundColor: '#ff9f0a',
                color: '#000000',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create First Note
            </button>
          </div>
        ) : (
          groupedSections.map((group) => (
            <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {group.title}
              </h3>

              {/* 2-Column Note Grid (Matching Screenshot 1) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '14px',
                }}
              >
                {group.items.map((note) => {
                  const previewSnippet = note.transcription || note.summary || 'Empty note content...';
                  const dateLabel = note.formattedTime ? note.formattedTime.split(',')[0].trim() : (note.date || 'Today');

                  return (
                    <motion.div
                      key={note.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onSelectNote(note)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        gap: '8px',
                      }}
                    >
                      {/* Dark Note Preview Card */}
                      <div
                        style={{
                          width: '100%',
                          height: '140px',
                          backgroundColor: '#1c1c1e',
                          borderRadius: '18px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '12px 14px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '11px',
                            color: '#d1d1d6',
                            lineHeight: 1.4,
                            margin: 0,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 7,
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'break-word',
                            fontFamily: 'monospace',
                          }}
                        >
                          {previewSnippet}
                        </p>
                      </div>

                      {/* Card Label: Title & Date */}
                      <div style={{ display: 'flex', flexDirection: 'column', padding: '0 2px' }}>
                        <h4
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#ffffff',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {note.title || 'Untitled Note'}
                        </h4>
                        <span style={{ fontSize: '13px', color: '#8e8e93', marginTop: '2px', fontWeight: 500 }}>
                          {dateLabel}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Bottom Search & Action Bar (Matching Screenshot 1) */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 10,
        }}
      >
        {/* Search Pill Input */}
        <div
          style={{
            flex: 1,
            height: '48px',
            backgroundColor: '#1c1c1e',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
          }}
        >
          <Search size={18} color="#8e8e93" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '15px',
            }}
          />
        </div>

        {/* Mic Action Button */}
        <button
          onClick={onMicClick}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#1c1c1e',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
          }}
        >
          <Mic size={20} color="#ffffff" />
        </button>

        {/* Compose New Note Button */}
        <button
          onClick={onNewNote}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#ff9f0a',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(255, 159, 10, 0.3)',
          }}
        >
          <SquarePen size={20} color="#000000" />
        </button>
      </div>
    </div>
  );
};
