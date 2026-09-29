import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { X, Download, Mic } from 'lucide-react-native';
import { AppHeader } from '../components/AppHeader';
import { CosmicBackground } from '../components/CosmicBackground';
import { audioService } from '../services/audioService';
import { COLORS } from '../theme';

interface RecordScreenProps {
  onMenuClick: () => void;
  onFinishCapturing: (thoughtText: string, localAudioUri?: string, durationSeconds?: number) => void;
}

const { width } = Dimensions.get('window');

export const RecordScreen: React.FC<RecordScreenProps> = ({
  onMenuClick,
  onFinishCapturing,
}) => {
  const [recordState, setRecordState] = useState<'idle' | 'listening' | 'paused' | 'capturing'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioUriRef = useRef<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation when listening
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (recordState === 'listening') {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [recordState]);

  // Duration timer
  useEffect(() => {
    let interval: any = null;
    if (recordState === 'listening') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordState]);

  // Capturing progress animation
  useEffect(() => {
    let interval: any = null;
    if (recordState === 'capturing') {
      setProgress(10);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (interval) clearInterval(interval);
            setTimeout(() => {
              const savedUri = audioUriRef.current;
              onFinishCapturing('Voice Note Recording', savedUri || undefined, seconds);
            }, 300);
            return 100;
          }
          return prev + 25;
        });
      }, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordState, seconds]);

  const startRecording = async () => {
    try {
      setSeconds(0);
      audioUriRef.current = null;
      await audioService.startRecording();
      setRecordState('listening');
    } catch (err) {
      Alert.alert('Microphone Access', 'Please enable microphone access in device settings to record your thoughts.');
    }
  };

  const handleStopOrSave = async () => {
    if (recordState === 'idle') {
      await startRecording();
      return;
    }
    const uri = await audioService.stopRecording();
    audioUriRef.current = uri;
    setRecordState('capturing');
  };

  const handleCancel = async () => {
    await audioService.cancelRecording();
    setSeconds(0);
    audioUriRef.current = null;
    setRecordState('idle');
  };

  const togglePause = async () => {
    if (recordState === 'listening') {
      await audioService.pauseRecording();
      setRecordState('paused');
    } else if (recordState === 'paused') {
      await audioService.resumeRecording();
      setRecordState('listening');
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(mins)} : ${pad(secs)}`;
  };

  return (
    <CosmicBackground style={styles.container}>
      <AppHeader onMenuClick={onMenuClick} />

      <View style={styles.content}>
        {recordState === 'capturing' ? (
          /* Capturing Progress View */
          <View style={styles.capturingView}>
            <View />

            <View style={styles.centerOrbWrap}>
              <Image
                source={require('../../assets/brain_orb.png')}
                style={styles.orb}
                resizeMode="contain"
              />
            </View>

            <View style={styles.capturingBottom}>
              <Text style={styles.capturingTitle}>Capturing{'\n'}your thoughts...</Text>
              <Text style={styles.capturingSubtitle}>Transcribing and making sense of it.</Text>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
            </View>
          </View>
        ) : (
          /* Idle / Listening / Paused View */
          <View style={styles.recordView}>
            {/* Brain Orb with Pulse */}
            <View style={styles.centerOrbWrap}>
              <Animated.Image
                source={require('../../assets/brain_orb.png')}
                style={[
                  styles.orb,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: recordState === 'idle' ? 0.75 : recordState === 'paused' ? 0.85 : 1,
                  },
                ]}
                resizeMode="contain"
              />
            </View>

            {/* Status Text & Live Timer */}
            <View style={styles.statusSection}>
              <Text style={styles.statusTitle}>
                {recordState === 'idle'
                  ? 'Tap Mic to Record'
                  : recordState === 'listening'
                  ? 'Listening...'
                  : 'Paused'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {recordState === 'idle'
                  ? 'Press the button below when ready'
                  : 'Tap stop when finished'}
              </Text>
              {recordState !== 'idle' && (
                <Text style={styles.timerText}>{formatTimer(seconds)}</Text>
              )}
            </View>

            {/* Mic / Stop Circle Button */}
            <View style={styles.actionBtnContainer}>
              {recordState === 'idle' ? (
                <TouchableOpacity
                  style={styles.micCircleBtn}
                  onPress={startRecording}
                  activeOpacity={0.8}
                >
                  <Mic size={38} color="#000000" strokeWidth={2.5} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.stopCircleBtn}
                  onPress={handleStopOrSave}
                  activeOpacity={0.8}
                >
                  <View style={styles.stopSquare} />
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom Controls (Cancel, Pause/Resume, Save) */}
            {recordState !== 'idle' ? (
              <View style={styles.controlsRow}>
                <TouchableOpacity style={styles.controlCircleBtn} onPress={handleCancel} activeOpacity={0.8}>
                  <X size={26} color={COLORS.white} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.pausePillBtn} onPress={togglePause} activeOpacity={0.85}>
                  <Text style={styles.pauseBtnText}>
                    {recordState === 'listening' ? 'Pause' : 'Resume'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlCircleBtn} onPress={handleStopOrSave} activeOpacity={0.8}>
                  <Download size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ height: 56 }} />
            )}
          </View>
        )}
      </View>
    </CosmicBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  recordView: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capturingView: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  centerOrbWrap: {
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: width * 0.62,
    height: width * 0.62,
    maxWidth: 240,
    maxHeight: 240,
  },
  statusSection: {
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.white,
  },
  statusSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  timerText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 6,
    letterSpacing: 1,
  },
  actionBtnContainer: {
    marginVertical: 16,
  },
  micCircleBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.cyanGlow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.cyanGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 10,
  },
  stopCircleBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.cyanBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  stopSquare: {
    width: 28,
    height: 28,
    backgroundColor: COLORS.danger,
    borderRadius: 4,
  },
  controlsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  controlCircleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(5, 20, 32, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausePillBtn: {
    width: 140,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  pauseBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.bgBlack,
  },
  capturingBottom: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  capturingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 34,
  },
  capturingSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 10,
  },
});
