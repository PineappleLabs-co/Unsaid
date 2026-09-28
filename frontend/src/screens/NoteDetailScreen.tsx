import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Share,
  MoreHorizontal,
  CheckSquare,
  Paperclip,
  Type,
  SquarePen,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Download,
  Play,
  Pause,
  Mic,
} from 'lucide-react';
import { Thought } from '../types';
import { getAudioUrl } from '../services/localAudioStore';

interface NoteDetailScreenProps {
  note: Thought;
  onBack: () => void;
  onUpdateNote: (updated: Thought) => void;
  onDeleteNote: (id: string) => void;
  onOpenTakeFurther: () => void;
}

export const NoteDetailScreen: React.FC<NoteDetailScreenProps> = ({
  note,
  onBack,
  onUpdateNote,
  onDeleteNote,
  onOpenTakeFurther,
}) => {
  const [title, setTitle] = useState(note.title || 'Untitled Note');
  const [content, setContent] = useState(note.transcription || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    getAudioUrl(note.id).then((url) => {
      if (!active) return;
      if (url) {
        createdUrl = url;
        setLocalAudioUrl(url);
      } else if (note.audioUrl) {
        setLocalAudioUrl(note.audioUrl);
      }
    });

    return () => {
      active = false;
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [note.id, note.audioUrl]);

  const togglePlayAudio = () => {
    if (!localAudioUrl) return;
    if (!audioPlayerRef.current) {
      const audio = new Audio(localAudioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((e) => console.warn('Audio play error:', e));
    }
  };

  useEffect(() => {
    setTitle(note.title || 'Untitled Note');
    setContent(note.transcription || '');
  }, [note]);

  const handleSave = () => {
    setIsEditing(false);
    onUpdateNote({
      ...note,
      title: title.trim() || 'Untitled Note',
      transcription: content,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${title}\n\n${content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, text: content }).catch(() => {});
    } else {
      handleCopy();
    }
  };

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
      {/* Top Header Bar (Matching Screenshot 2) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#000000',
          zIndex: 10,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          <button
            onClick={handleShare}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#1c1c1e',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Share size={18} />
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#1c1c1e',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <MoreHorizontal size={20} />
          </button>

          {/* Context Dropdown Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  backgroundColor: '#1c1c1e',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
                  padding: '6px',
                  width: '200px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenTakeFurther();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff9f0a',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Sparkles size={16} /> Take Further (AI)
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleCopy();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {copied ? <Check size={16} color="#00dfc4" /> : <Copy size={16} />} Copy Text
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDeleteNote(note.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff453a',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Trash2 size={16} /> Delete Note
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Note Document Content Body (Matching Screenshot 2) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 22px 90px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Document Title Header */}
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#ffffff',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: '2px solid #ff9f0a',
              outline: 'none',
              width: '100%',
              paddingBottom: '4px',
            }}
          />
        ) : (
          <h1
            onClick={() => setIsEditing(true)}
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              margin: 0,
              cursor: 'text',
            }}
          >
            {title}
          </h1>
        )}

        {/* Structured Metadata / Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px', color: '#d1d1d6' }}>
          <div>
            <strong style={{ color: '#ffffff' }}>Category:</strong> {note.category}
          </div>
          <div>
            <strong style={{ color: '#ffffff' }}>Created:</strong> {note.formattedTime || note.date}
          </div>
          {note.tags && note.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              {note.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    backgroundColor: '#1c1c1e',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    color: '#8e8e93',
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Local Voice Memo Playback Bar */}
          {localAudioUrl && (
            <div
              style={{
                marginTop: '10px',
                padding: '10px 14px',
                borderRadius: '14px',
                backgroundColor: '#1c1c1e',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: '#ff9f0a',
                    border: 'none',
                    color: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {isPlayingAudio ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
                </button>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mic size={14} color="#ff9f0a" /> Voice Memo
                  </div>
                  <div style={{ fontSize: '11px', color: '#8e8e93' }}>
                    Stored locally on device • {note.audioDuration || '00:28'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#ff9f0a', fontWeight: 600 }}>
                {isPlayingAudio ? 'Playing' : 'Tap to play'}
              </div>
            </div>
          )}
        </div>

        {/* Horizontal Divider Line */}
        <hr style={{ border: 'none', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.15)', margin: '10px 0' }} />

        {/* Main Document Text Area */}
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              flex: 1,
              minHeight: '260px',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '16px',
              lineHeight: 1.6,
              fontFamily: 'inherit',
              resize: 'none',
            }}
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#ebebf5',
              whiteSpace: 'pre-wrap',
              cursor: 'text',
            }}
          >
            {content || 'Tap here to add content to your note...'}
          </div>
        )}
      </div>

      {/* Bottom Floating Apple Notes Toolbar (Matching Screenshot 2) */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 16,
          right: 16,
          height: '50px',
          backgroundColor: '#1c1c1e',
          borderRadius: '25px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 8px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
          zIndex: 10,
        }}
      >
        {/* Checklist button */}
        <button
          onClick={() => {
            setContent((prev) => prev + '\n- [ ] ');
            setIsEditing(true);
          }}
          style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '8px' }}
        >
          <CheckSquare size={20} />
        </button>

        {/* Attachment button */}
        <button
          onClick={() => {
            setContent((prev) => prev + '\n\n**Attachment:** ');
            setIsEditing(true);
          }}
          style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '8px' }}
        >
          <Paperclip size={20} />
        </button>

        {/* Formatting button */}
        <button
          onClick={() => {
            setContent((prev) => prev + '\n\n### Section Title\n');
            setIsEditing(true);
          }}
          style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '8px' }}
        >
          <Type size={20} />
        </button>

        {/* AI Take Further Trigger */}
        <button
          onClick={onOpenTakeFurther}
          style={{
            background: 'none',
            border: 'none',
            color: '#ff9f0a',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          <Sparkles size={18} />
          <span>AI</span>
        </button>

        {/* Edit / Done Toggle */}
        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          style={{
            background: isEditing ? '#ff9f0a' : 'transparent',
            border: 'none',
            color: isEditing ? '#000000' : '#ffffff',
            borderRadius: '16px',
            padding: isEditing ? '4px 12px' : '8px',
            cursor: 'pointer',
            fontSize: isEditing ? '13px' : 'inherit',
            fontWeight: isEditing ? 700 : 'normal',
          }}
        >
          {isEditing ? 'Done' : <SquarePen size={20} />}
        </button>
      </div>
    </div>
  );
};
