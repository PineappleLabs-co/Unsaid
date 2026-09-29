import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Share2,
  Trash2,
  Play,
  Pause,
  Copy,
  Check,
  Pencil,
  Sparkles,
  CheckSquare,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { AppHeader } from '../components/AppHeader';
import { CosmicBackground } from '../components/CosmicBackground';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { Thought } from '../types';
import { api } from '../services/api';
import { audioService } from '../services/audioService';
import { COLORS } from '../theme';

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

  const [totalAudioDuration, setTotalAudioDuration] = useState<number>(() => {
    const parts = (thought.audioDuration || '00:28').split(':');
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 28;
    return mins * 60 + secs;
  });

  useEffect(() => {
    setCurrentThought(thought);
    setText(thought.transcription);
  }, [thought]);

  useEffect(() => {
    return () => {
      audioService.stopSound().catch(() => {});
    };
  }, []);

  // Poll backend for real Groq AI enrichment result if pending
  useEffect(() => {
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

            const updated = await api.getThought(thought.id).catch(() => null);
            const freshTranscript = updated?.transcript || updated?.raw_text || thought.transcription;

            setCurrentThought((prev) => ({
              ...prev,
              title: status.title || prev.title,
              summary: status.summary || prev.summary,
              tags: status.tags || prev.tags,
              transcription: freshTranscript,
              enrichment_status: 'complete',
            }));
            setText(freshTranscript);
          } else if (status.enrichment_status === 'failed' || count > 12) {
            clearInterval(interval);
            setEnriching(false);
          }
        } catch {
          if (count > 8) {
            clearInterval(interval);
            setEnriching(false);
          }
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [thought]);

  const toggleAudioPlayback = async () => {
    const audioUri = currentThought.localAudioUri || currentThought.audioUrl;
    if (!audioUri) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (isPlaying) {
      await audioService.pauseSound();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      await audioService.playSound(audioUri, (status) => {
        if (status.positionMillis) {
          setAudioSeconds(Math.floor(status.positionMillis / 1000));
        }
        if (status.durationMillis) {
          setTotalAudioDuration(Math.floor(status.durationMillis / 1000));
        }
        if (status.didJustFinish) {
          setIsPlaying(false);
          setAudioSeconds(0);
        }
      });
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Clipboard.setStringAsync(`${currentThought.title}\n\n${text}`);
        Alert.alert('Shared', 'Content copied to clipboard.');
      } else {
        await handleCopy();
      }
    } catch {
      await handleCopy();
    }
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
      console.warn('Save edit notice:', e);
    }
  };

  const formatAudioTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(m)}:${pad(s)}`;
  };

  return (
    <CosmicBackground style={styles.container}>
      <AppHeader onBackClick={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Thought Header */}
        <View style={styles.topHeader}>
          <Image
            source={require('../../assets/brain_orb.png')}
            style={styles.headerOrb}
            resizeMode="contain"
          />
          <View style={styles.headerMeta}>
            <Text style={styles.headerTitle}>{currentThought.title}</Text>
            <View style={styles.headerSubRow}>
              <Text style={styles.headerSubText}>
                {currentThought.formattedTime} , {currentThought.category}
              </Text>
              {enriching && (
                <View style={styles.enrichingBadge}>
                  <ActivityIndicator size="small" color={COLORS.cyanGlow} />
                  <Text style={styles.enrichingText}>AI Organizing...</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* AI Summary Card */}
        {currentThought.summary && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeading}>
              <Sparkles size={14} color={COLORS.cyanGlow} />
              <Text style={styles.summaryHeadingText}>AI Summary</Text>
            </View>
            <Text style={styles.summaryBodyText}>{currentThought.summary}</Text>
          </View>
        )}

        {/* Tags */}
        {currentThought.tags && currentThought.tags.length > 0 && (
          <View style={styles.tagList}>
            {currentThought.tags.map((tag, idx) => (
              <View key={idx} style={styles.tagItem}>
                <Text style={styles.tagItemText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Header Pill & Icons */}
        <View style={styles.actionHeaderRow}>
          <View style={styles.descriptionPill}>
            <Text style={styles.descriptionPillText}>Description</Text>
          </View>

          <View style={styles.actionIcons}>
            <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
              <Share2 size={22} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(currentThought.id)} activeOpacity={0.7}>
              <Trash2 size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Audio Player Card */}
        <View style={styles.audioPlayerCard}>
          <View style={styles.audioPlayerRow}>
            <TouchableOpacity style={styles.playBtn} onPress={toggleAudioPlayback} activeOpacity={0.8}>
              {isPlaying ? (
                <Pause size={20} color={COLORS.white} fill={COLORS.white} />
              ) : (
                <Play size={20} color={COLORS.white} fill={COLORS.white} style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>

            <WaveformVisualizer
              isActive={isPlaying}
              progressPercent={totalAudioDuration > 0 ? audioSeconds / totalAudioDuration : 0}
            />
          </View>

          <Text style={styles.audioDurationLabel}>
            {formatAudioTime(audioSeconds)} / {formatAudioTime(totalAudioDuration)}
          </Text>
        </View>

        {/* Transcribed Thought Box */}
        <View style={styles.transcribedSection}>
          <Text style={styles.transcribedHeader}>Transcribed thought</Text>

          <View style={styles.transcribedBox}>
            {/* Copy Button */}
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
              {copied ? (
                <Check size={18} color={COLORS.cyanBadge} />
              ) : (
                <Copy size={18} color={COLORS.white} />
              )}
            </TouchableOpacity>

            {/* Content */}
            {isEditing ? (
              <TextInput
                style={styles.transcribedInput}
                value={text}
                onChangeText={setText}
                multiline
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.transcribedText}>{text}</Text>
            )}

            {/* Edit Button */}
            <TouchableOpacity
              style={styles.editPillBtn}
              onPress={() => (isEditing ? handleSaveEdit() : setIsEditing(true))}
              activeOpacity={0.8}
            >
              <Text style={styles.editPillText}>{isEditing ? 'Save' : 'Edit'}</Text>
              <Pencil size={12} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Structured Plan Breakdown */}
        {currentThought.structuredPlan && (
          <View style={styles.planSection}>
            {/* Actionable Milestones */}
            {currentThought.structuredPlan.actionableSteps &&
              currentThought.structuredPlan.actionableSteps.length > 0 && (
                <View style={styles.milestonesCard}>
                  <View style={styles.milestonesHeader}>
                    <CheckSquare size={18} color={COLORS.cyanGlow} />
                    <Text style={styles.milestonesTitle}>Actionable Milestones</Text>
                  </View>

                  <View style={styles.milestonesList}>
                    {currentThought.structuredPlan.actionableSteps.map((step, idx) => (
                      <View key={idx} style={styles.stepItem}>
                        <View style={styles.stepBox}>
                          <Check size={12} color={COLORS.cyanGlow} />
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            {/* Deep Insights */}
            {currentThought.structuredPlan.insights &&
              currentThought.structuredPlan.insights.length > 0 && (
                <View style={styles.insightsCard}>
                  <View style={styles.insightsHeader}>
                    <Sparkles size={18} color={COLORS.proYellow} />
                    <Text style={styles.insightsTitle}>Deep Insights & Context</Text>
                  </View>
                  {currentThought.structuredPlan.insights.map((ins, idx) => (
                    <Text key={idx} style={styles.insightText}>
                      • {ins}
                    </Text>
                  ))}
                </View>
              )}

            {/* Suggested Capabilities */}
            {currentThought.structuredPlan.suggestedFeatures &&
              currentThought.structuredPlan.suggestedFeatures.length > 0 && (
                <View style={styles.featuresWrap}>
                  <Text style={styles.featuresHeading}>Suggested Capabilities</Text>
                  <View style={styles.featuresBadges}>
                    {currentThought.structuredPlan.suggestedFeatures.map((feat, idx) => (
                      <View key={idx} style={styles.featureBadge}>
                        <Text style={styles.featureBadgeText}>{feat}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.takeFurtherBtn} onPress={onTakeFurther} activeOpacity={0.85}>
            <Text style={styles.takeFurtherBtnText}>Take this thought further</Text>
            <Sparkles size={20} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity onPress={onBack} style={styles.notNowBtn} activeOpacity={0.7}>
            <Text style={styles.notNowText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </CosmicBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 40,
    gap: 18,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
  },
  headerOrb: {
    width: 56,
    height: 56,
  },
  headerMeta: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 28,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  headerSubText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  enrichingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enrichingText: {
    color: COLORS.cyanGlow,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 14,
    backgroundColor: 'rgba(0, 180, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.3)',
    borderRadius: 16,
    gap: 6,
  },
  summaryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryHeadingText: {
    color: COLORS.cyanGlow,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryBodyText: {
    fontSize: 14,
    color: '#e0f2fe',
    lineHeight: 20,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    backgroundColor: 'rgba(5, 25, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.25)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  descriptionPill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cyanGlow,
  },
  descriptionPillText: {
    color: COLORS.cyanGlow,
    fontSize: 14,
    fontWeight: '600',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  audioPlayerCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 25, 42, 0.85)',
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    gap: 10,
  },
  audioPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cyanBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.cyanBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  audioDurationLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginLeft: 58,
  },
  transcribedSection: {
    gap: 10,
  },
  transcribedHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  transcribedBox: {
    position: 'relative',
    backgroundColor: 'rgba(3, 15, 25, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    padding: 20,
    minHeight: 180,
    paddingBottom: 44,
  },
  copyBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
  },
  transcribedInput: {
    color: COLORS.white,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
  },
  transcribedText: {
    color: COLORS.white,
    fontSize: 16,
    lineHeight: 24,
    paddingRight: 24,
  },
  editPillBtn: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editPillText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  planSection: {
    gap: 16,
  },
  milestonesCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(7, 32, 51, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.35)',
    gap: 12,
  },
  milestonesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  milestonesTitle: {
    color: COLORS.cyanGlow,
    fontSize: 15,
    fontWeight: '700',
  },
  milestonesList: {
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.cyanGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepText: {
    flex: 1,
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 20,
  },
  insightsCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 25, 42, 0.75)',
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    gap: 8,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightsTitle: {
    color: COLORS.proYellow,
    fontSize: 15,
    fontWeight: '700',
  },
  insightText: {
    fontSize: 13,
    color: '#b0cee0',
    lineHeight: 18,
  },
  featuresWrap: {
    gap: 8,
  },
  featuresHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  featuresBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureBadge: {
    backgroundColor: 'rgba(0, 180, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 255, 0.4)',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  featureBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.cyanGlow,
  },
  bottomSection: {
    gap: 14,
    marginTop: 10,
  },
  takeFurtherBtn: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  takeFurtherBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.bgBlack,
  },
  notNowBtn: {
    alignItems: 'center',
    padding: 6,
  },
  notNowText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
