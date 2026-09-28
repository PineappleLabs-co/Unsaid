import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Trash2, Play, Pause, Copy, Check, Pencil, Sparkles, Loader2, CheckSquare } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { Thought } from '../types';
import { api } from '../services/api';

interface ThoughtDetailScreenProps {
  thought: Thought;
  onBack: () => void;
  onTakeFurther: () => void;
  onDelete: (id: string) => void;
}

export const ThoughtDetailScreen: React.FC<ThoughtDetailScreenProps> = ({
  thought,
  onBack,
  onTakeFurther,
  onDelete,
}) => {
  const [currentThought, setCurrentThought] = useState<Thought>(thought);
  const [enriching, setEnriching] = useState<boolean>(
    thought.enrichment_status === 'pending' || thought.enrichment_status === 'processing'
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(thought.transcription);

  // Poll backend for real Groq AI enrichment result
  useEffect(() => {
    setCurrentThought(thought);
    setText(thought.transcription);
    if (thought.enrichment_status === 'pending' || thought.enrichment_status === 'processing') {
      setEnriching(true);
      let count = 0;
      const interval = setInterval(async () => {
        count++;
        try {
          const status = await api.getEnrichmentStatus(thought.id);
          if (status.enrichment_status === 'complete') {
            clearInterval(interval);
            setEnriching(false);
            setCurrentThought((prev) => ({
              ...prev,
              title: status.title || prev.title,
              summary: status.summary || prev.summary,
              tags: status.tags || prev.tags,
              enrichment_status: 'complete',
            }));
          } else if (status.enrichment_status === 'failed' || count > 15) {
            clearInterval(interval);
            setEnriching(false);
          }
        } catch {
          if (count > 8) {
            clearInterval(interval);
            setEnriching(false);
          }
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [thought]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setAudioSeconds((prev) => {
          if (prev >= 28) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = async () => {
    setIsEditing(false);
    try {
      await api.updateThought(currentThought.id, {
        base_version: currentThought.version || 1,
        transcript: text,
        raw_text: text,
      });
      setCurrentThought((prev) => ({ ...prev, transcription: text, version: (prev.version || 1) + 1 }));
    } catch (e) {
      console.warn('Save edit failed:', e);
    }
  };

  const formatAudioTime = (secs: number) => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `00:${pad(secs)}`;
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onBackClick={onBack} />

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
        {/* Top Thought Card Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
          <img
            src="/assets/brain_orb.png"
            alt="Orb"
            className={enriching ? 'animate-orb' : ''}
            style={{ width: '56px', height: '56px', objectFit: 'contain' }}
          />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', lineHeight: 1.25 }}>
              {currentThought.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '14px', color: '#8eb3cb', fontWeight: 500 }}>
                {currentThought.formattedTime} , {currentThought.category}
              </p>
              {enriching && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#00d8ff', fontSize: '13px', fontWeight: 600 }}>
                  <Loader2 size={13} className="animate-spin" /> AI Organizing...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Summary Card (if present) */}
        {currentThought.summary && (
          <div
            className="glass-card"
            style={{
              padding: '14px 18px',
              backgroundColor: 'rgba(0, 180, 255, 0.08)',
              border: '1px solid rgba(0, 216, 255, 0.3)',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00d8ff', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              <Sparkles size={14} /> AI Summary
            </div>
            <p style={{ fontSize: '14px', color: '#e0f2fe', lineHeight: 1.45 }}>
              {currentThought.summary}
            </p>
          </div>
        )}

        {/* Tags (if present) */}
        {currentThought.tags && currentThought.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {currentThought.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#8eb3cb',
                  background: 'rgba(5, 25, 42, 0.8)',
                  border: '1px solid rgba(0, 163, 255, 0.25)',
                  borderRadius: '12px',
                  padding: '3px 10px',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Header Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid #00d8ff',
              color: '#00d8ff',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Description
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: thought.title, text: thought.transcription });
                }
              }}
            >
              <Share2 size={22} />
            </button>
            <button
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              onClick={() => onDelete(thought.id)}
            >
              <Trash2 size={22} />
            </button>
          </div>
        </div>

        {/* Audio Player Card */}
        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: 'rgba(5, 25, 42, 0.85)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#00a3ff',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(0, 163, 255, 0.5)',
              }}
            >
              {isPlaying ? <Pause size={20} fill="#ffffff" /> : <Play size={20} fill="#ffffff" style={{ marginLeft: 2 }} />}
            </button>

            {/* Waveform Visualizer */}
            <div className="waveform-container">
              {[12, 24, 30, 18, 28, 35, 20, 14, 26, 32, 22, 16, 30, 36, 24, 18, 28, 32, 20, 14, 26, 18, 24, 30, 16, 22, 28].map(
                (h, idx) => (
                  <div
                    key={idx}
                    className="waveform-bar"
                    style={{
                      height: isPlaying ? `${Math.max(8, (h + (audioSeconds * 7 + idx * 3) % 25))}px` : `${h}px`,
                      opacity: idx < audioSeconds * 0.9 ? 1 : 0.4,
                      backgroundColor: idx < audioSeconds * 0.9 ? '#00d8ff' : '#ffffff',
                    }}
                  />
                )
              )}
            </div>
          </div>

          <div style={{ fontSize: '13px', color: '#8eb3cb', fontWeight: 500, marginLeft: '60px' }}>
            {formatAudioTime(audioSeconds)} / {thought.audioDuration}
          </div>
        </div>

        {/* Transcribed Thought Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
            Transcribed thought
          </h3>

          <div
            style={{
              position: 'relative',
              background: 'rgba(3, 15, 25, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '20px',
              padding: '20px',
              minHeight: '180px',
            }}
          >
            {/* Copy button */}
            <button
              onClick={handleCopy}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={20} color="#00dfc4" /> : <Copy size={20} />}
            </button>

            {/* Editable / Readonly Text */}
            {isEditing ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{
                  width: '100%',
                  height: '110px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '16px',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                  resize: 'none',
                }}
              />
            ) : (
              <p style={{ fontSize: '16px', color: '#ffffff', lineHeight: 1.5, paddingRight: '20px' }}>
                {text}
              </p>
            )}

            {/* Edit Button */}
            <button
              onClick={() => {
                if (isEditing) {
                  handleSaveEdit();
                } else {
                  setIsEditing(true);
                }
              }}
              style={{
                position: 'absolute',
                bottom: 12,
                right: 14,
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '16px',
                padding: '4px 12px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              {isEditing ? 'Save' : 'Edit'} <Pencil size={13} />
            </button>
          </div>
        </div>

        {/* Deep AI Structured Plan & Execution Sections */}
        {currentThought.structuredPlan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Actionable Steps Checklist */}
            {currentThought.structuredPlan.actionableSteps && currentThought.structuredPlan.actionableSteps.length > 0 && (
              <div
                className="glass-card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: '1px solid rgba(0, 216, 255, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00d8ff', fontSize: '15px', fontWeight: 700 }}>
                  <CheckSquare size={18} /> Actionable Milestones
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentThought.structuredPlan.actionableSteps.map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        fontSize: '14px',
                        color: '#e2f1fd',
                        lineHeight: 1.4,
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: '1.5px solid #00d8ff',
                          marginTop: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={12} color="#00d8ff" />
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {currentThought.structuredPlan.insights && currentThought.structuredPlan.insights.length > 0 && (
              <div
                className="glass-card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  backgroundColor: 'rgba(5, 25, 42, 0.75)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffee00', fontSize: '15px', fontWeight: 700 }}>
                  <Sparkles size={18} /> Deep Insights & Context
                </div>
                {currentThought.structuredPlan.insights.map((ins, idx) => (
                  <p key={idx} style={{ fontSize: '13px', color: '#b0cee0', lineHeight: 1.45 }}>
                    • {ins}
                  </p>
                ))}
              </div>
            )}

            {/* Suggested Features */}
            {currentThought.structuredPlan.suggestedFeatures && currentThought.structuredPlan.suggestedFeatures.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#8eb3cb' }}>Suggested Architecture</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {currentThought.structuredPlan.suggestedFeatures.map((feat, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#00d8ff',
                        background: 'rgba(0, 180, 255, 0.15)',
                        border: '1px solid rgba(0, 216, 255, 0.4)',
                        borderRadius: '14px',
                        padding: '5px 12px',
                      }}
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px' }}>
          <button className="btn-primary" onClick={onTakeFurther}>
            Take this thought further <Sparkles size={20} />
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
