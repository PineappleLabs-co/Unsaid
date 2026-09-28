import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Mic } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';

interface RecordScreenProps {
  onMenuClick: () => void;
  onFinishCapturing: (thoughtText: string, audioBlob?: Blob, durationSeconds?: number) => void;
}

export const RecordScreen: React.FC<RecordScreenProps> = ({
  onMenuClick,
  onFinishCapturing,
}) => {
  const [recordState, setRecordState] = useState<'listening' | 'paused' | 'capturing'>('listening');
  const [seconds, setSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize MediaRecorder & SpeechRecognition
  useEffect(() => {
    let stream: MediaStream | null = null;
    audioChunksRef.current = [];

    // Setup real audio recording
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((s) => {
          stream = s;
          try {
            const recorder = new MediaRecorder(s);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                audioChunksRef.current.push(e.data);
              }
            };

            recorder.onstop = () => {
              const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              audioBlobRef.current = blob;
            };

            recorder.start(500); // 500ms time slice
          } catch (err) {
            console.warn('MediaRecorder error, using fallback:', err);
          }
        })
        .catch((err) => {
          console.warn('Microphone permission not granted or unavailable:', err);
        });
    }

    // Optional SpeechRecognition preview
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript + ' ';
          }
          if (current.trim()) {
            setTranscriptPreview(current.trim());
          }
        };
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
      }
    }

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Timer logic for recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (recordState === 'listening') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordState]);

  // Transcribing progress bar logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (recordState === 'capturing') {
      setProgress(10);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (interval) clearInterval(interval);
            setTimeout(() => {
              const textToSave = transcriptPreview || 'Complete the project proposal for the client. Include the research, UI mockups and timeline. Also check the budget and confirm with the team tomorrow.';
              onFinishCapturing(textToSave, audioBlobRef.current || undefined, seconds);
            }, 300);
            return 100;
          }
          return prev + 25;
        });
      }, 200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordState, onFinishCapturing, transcriptPreview, seconds]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(mins)} : ${pad(secs)}`;
  };

  const handleStopOrSave = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setRecordState('capturing');
  };

  const handleCancel = () => {
    setSeconds(0);
    audioChunksRef.current = [];
    audioBlobRef.current = null;
    setTranscriptPreview('');
    setRecordState('listening');
  };

  const togglePause = () => {
    if (recordState === 'listening') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      setRecordState('paused');
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      setRecordState('listening');
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onMenuClick={onMenuClick} />

      <div className="screen-content" style={{ justifyContent: 'space-between', paddingBottom: '30px' }}>
        {recordState === 'capturing' ? (
          /* Capturing Process View (Capturing process.png) */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 0',
              textAlign: 'center',
            }}
          >
            <div />

            {/* Brain Orb */}
            <div style={{ margin: '30px 0' }}>
              <img
                src="/assets/brain_orb.png"
                alt="Brain Orb"
                className="animate-orb"
                style={{ width: '230px', height: '230px', objectFit: 'contain' }}
              />
            </div>

            {/* Progress Text & Bar */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
                Capturing
                <br />
                your thoughts...
              </h2>
              <p style={{ fontSize: '15px', color: '#8eb3cb', fontWeight: 500 }}>
                Transcribing and making sense of it.
              </p>

              {/* Progress bar matching Figma */}
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  marginTop: '16px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    transition: 'width 0.25s ease',
                  }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          /* Listening / Paused View (record.png & pause.png) */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              textAlign: 'center',
            }}
          >
            {/* Brain Orb Artwork */}
            <div style={{ margin: '20px 0' }}>
              <img
                src="/assets/brain_orb.png"
                alt="Brain Orb"
                className={recordState === 'listening' ? 'animate-orb' : ''}
                style={{
                  width: '230px',
                  height: '230px',
                  objectFit: 'contain',
                  filter: recordState === 'paused' ? 'brightness(0.8)' : 'none',
                }}
              />
            </div>

            {/* Status & Timer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff' }}>
                {recordState === 'listening' ? 'Listening...' : 'Paused'}
              </h2>
              <p style={{ fontSize: '15px', color: '#8eb3cb', fontWeight: 500 }}>
                Tap to save
              </p>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginTop: '6px',
                  letterSpacing: '1px',
                }}
              >
                {formatTimer(seconds)}
              </div>
            </div>

            {/* Center Record Stop Button */}
            <div style={{ margin: '20px 0' }}>
              <button
                onClick={handleStopOrSave}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: '4px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 30px rgba(0, 180, 255, 0.4)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: '#e62e2e',
                    borderRadius: '4px',
                  }}
                />
              </button>
            </div>

            {/* Bottom Controls Bar */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 10px',
              }}
            >
              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(5, 20, 32, 0.7)',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={26} />
              </button>

              {/* Pause / Resume Button */}
              <button
                onClick={togglePause}
                className="btn-primary"
                style={{
                  width: '140px',
                  height: '52px',
                  fontSize: '18px',
                  borderRadius: '28px',
                  boxShadow: '0 4px 20px rgba(255, 255, 255, 0.15)',
                }}
              >
                {recordState === 'listening' ? 'Pause' : 'Resume'}
              </button>

              {/* Save Button */}
              <button
                onClick={handleStopOrSave}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(5, 20, 32, 0.7)',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Download size={24} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
