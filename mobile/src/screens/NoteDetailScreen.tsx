import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
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
  Play,
  Pause,
  Mic,
} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Thought } from '../types';
import { audioService } from '../services/audioService';
import { COLORS } from '../theme';

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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    setTitle(note.title || 'Untitled Note');
    setContent(note.transcription || '');
  }, [note]);

  useEffect(() => {
    return () => {
      audioService.stopSound().catch(() => {});
    };
  }, []);

  const togglePlayAudio = async () => {
    const audioUri = note.localAudioUri || note.audioUrl;
    if (!audioUri) return;

    if (isPlayingAudio) {
      await audioService.pauseSound();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      await audioService.playSound(audioUri, (status) => {
        if (status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    onUpdateNote({
      ...note,
      title: title.trim() || 'Untitled Note',
      transcription: content,
    });
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(`${title}\n\n${content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Clipboard.setStringAsync(`${title}\n\n${content}`);
        Alert.alert('Shared', 'Note content copied to clipboard.');
      } else {
        await handleCopy();
      }
    } catch {
      await handleCopy();
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDeleteNote(note.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.circleBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={22} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.circleBtn} onPress={handleShare} activeOpacity={0.7}>
            <Share size={18} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => setIsMenuOpen(true)}
            activeOpacity={0.7}
          >
            <MoreHorizontal size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Context Menu Modal */}
      <Modal visible={isMenuOpen} transparent animationType="fade" onRequestClose={() => setIsMenuOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
          <View style={styles.menuOverlay}>
            <View style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuAction}
                onPress={() => {
                  setIsMenuOpen(false);
                  onOpenTakeFurther();
                }}
              >
                <Sparkles size={16} color={COLORS.appleOrange} />
                <Text style={styles.menuActionOrange}>Take Further (AI)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuAction}
                onPress={() => {
                  setIsMenuOpen(false);
                  handleCopy();
                }}
              >
                {copied ? <Check size={16} color={COLORS.cyanBadge} /> : <Copy size={16} color={COLORS.white} />}
                <Text style={styles.menuActionWhite}>Copy Text</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuAction}
                onPress={() => {
                  setIsMenuOpen(false);
                  handleDelete();
                }}
              >
                <Trash2 size={16} color={COLORS.appleRed} />
                <Text style={styles.menuActionRed}>Delete Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Document Body */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        {isEditing ? (
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Note Title"
            placeholderTextColor="#666"
          />
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)} activeOpacity={0.9}>
            <Text style={styles.titleText}>{title}</Text>
          </TouchableOpacity>
        )}

        {/* Metadata */}
        <View style={styles.metaSection}>
          <Text style={styles.metaText}>
            <Text style={styles.metaLabel}>Category: </Text>
            {note.category}
          </Text>
          <Text style={styles.metaText}>
            <Text style={styles.metaLabel}>Created: </Text>
            {note.formattedTime || note.date}
          </Text>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <View style={styles.tagRow}>
              {note.tags.map((t) => (
                <View key={t} style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>#{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Voice Memo Player Bar */}
          {(note.localAudioUri || note.audioUrl) && (
            <View style={styles.audioPlayerCard}>
              <View style={styles.audioPlayerLeft}>
                <TouchableOpacity
                  style={styles.audioPlayBtn}
                  onPress={togglePlayAudio}
                  activeOpacity={0.8}
                >
                  {isPlayingAudio ? (
                    <Pause size={16} color="#000000" />
                  ) : (
                    <Play size={16} color="#000000" style={{ marginLeft: 2 }} />
                  )}
                </TouchableOpacity>

                <View>
                  <View style={styles.voiceMemoHeading}>
                    <Mic size={14} color={COLORS.appleOrange} />
                    <Text style={styles.voiceMemoTitle}>Voice Memo</Text>
                  </View>
                  <Text style={styles.voiceMemoSub}>Stored locally • {note.audioDuration || '00:28'}</Text>
                </View>
              </View>

              <Text style={styles.audioPlayingStatus}>
                {isPlayingAudio ? 'Playing' : 'Tap to play'}
              </Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Note Content Text / TextInput */}
        {isEditing ? (
          <TextInput
            style={styles.bodyInput}
            value={content}
            onChangeText={setContent}
            multiline
            placeholder="Tap here to add content to your note..."
            placeholderTextColor="#666"
            textAlignVertical="top"
          />
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)} activeOpacity={0.9}>
            <Text style={styles.bodyText}>
              {content || 'Tap here to add content to your note...'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Floating Apple Notes Action Bar */}
      <View style={styles.floatingToolbar}>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => {
            setContent((prev) => prev + '\n- [ ] ');
            setIsEditing(true);
          }}
          activeOpacity={0.7}
        >
          <CheckSquare size={20} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => {
            setContent((prev) => prev + '\n\n**Attachment:** ');
            setIsEditing(true);
          }}
          activeOpacity={0.7}
        >
          <Paperclip size={20} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => {
            setContent((prev) => prev + '\n\n### Section Title\n');
            setIsEditing(true);
          }}
          activeOpacity={0.7}
        >
          <Type size={20} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, styles.aiToolBtn]}
          onPress={onOpenTakeFurther}
          activeOpacity={0.7}
        >
          <Sparkles size={18} color={COLORS.appleOrange} />
          <Text style={styles.aiToolText}>AI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.doneBtn, isEditing && styles.doneBtnActive]}
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          activeOpacity={0.8}
        >
          {isEditing ? (
            <Text style={styles.doneText}>Done</Text>
          ) : (
            <SquarePen size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    height: Platform.OS === 'android' ? 60 : 54,
    marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) : 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.appleNoteCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 18,
  },
  menuCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 6,
    width: 190,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  menuAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  menuActionOrange: {
    color: COLORS.appleOrange,
    fontSize: 14,
    fontWeight: '600',
  },
  menuActionWhite: {
    color: COLORS.white,
    fontSize: 14,
  },
  menuActionRed: {
    color: COLORS.appleRed,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 22,
    paddingBottom: 90,
    gap: 16,
  },
  titleInput: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.appleOrange,
    paddingBottom: 4,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 34,
  },
  metaSection: {
    gap: 6,
  },
  metaText: {
    fontSize: 15,
    color: '#d1d1d6',
  },
  metaLabel: {
    color: COLORS.white,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tagBadge: {
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  tagBadgeText: {
    fontSize: 12,
    color: COLORS.appleGray,
  },
  audioPlayerCard: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioPlayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  audioPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.appleOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceMemoHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceMemoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  voiceMemoSub: {
    fontSize: 11,
    color: COLORS.appleGray,
  },
  audioPlayingStatus: {
    fontSize: 12,
    color: COLORS.appleOrange,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 4,
  },
  bodyInput: {
    minHeight: 260,
    color: COLORS.white,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ebebf5',
  },
  floatingToolbar: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 18 : 26,
    left: 16,
    right: 16,
    height: 50,
    backgroundColor: '#1c1c1e',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 10,
  },
  toolBtn: {
    padding: 8,
  },
  aiToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiToolText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.appleOrange,
  },
  doneBtn: {
    padding: 8,
  },
  doneBtnActive: {
    backgroundColor: COLORS.appleOrange,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  doneText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
});
