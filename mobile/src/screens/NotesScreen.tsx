import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import {
  ChevronLeft,
  MoreHorizontal,
  Search,
  Mic,
  SquarePen,
  Cloud,
} from 'lucide-react-native';
import { Thought } from '../types';
import { COLORS } from '../theme';

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

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36 - 14) / 2;

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

  // Group notes chronologically
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
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerCircleBtn} onPress={onBackClick} activeOpacity={0.7}>
          <ChevronLeft size={22} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Notes</Text>
          <View style={styles.syncedBadge}>
            <Cloud size={12} color={COLORS.appleGray} />
            <Text style={styles.syncedText}>Synced</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerCircleBtn} activeOpacity={0.7}>
          <MoreHorizontal size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Grouped Notes Scroll Area */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {groupedSections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <SquarePen size={44} color={COLORS.appleGray} strokeWidth={1.5} />
            <Text style={styles.emptyText}>No Notes Found</Text>
            <TouchableOpacity style={styles.createFirstBtn} onPress={onNewNote} activeOpacity={0.8}>
              <Text style={styles.createFirstBtnText}>Create First Note</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groupedSections.map((group) => (
            <View key={group.title} style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>{group.title}</Text>

              {/* 2-Column Note Grid */}
              <View style={styles.cardsGrid}>
                {group.items.map((note) => {
                  const previewSnippet = note.transcription || note.summary || 'Empty note content...';
                  const dateLabel = note.formattedTime
                    ? note.formattedTime.split(',')[0].trim()
                    : note.date || 'Today';

                  return (
                    <TouchableOpacity
                      key={note.id}
                      style={styles.cardItem}
                      onPress={() => onSelectNote(note)}
                      activeOpacity={0.8}
                    >
                      {/* Dark Note Preview Card */}
                      <View style={styles.previewBox}>
                        <Text style={styles.previewText} numberOfLines={7}>
                          {previewSnippet}
                        </Text>
                      </View>

                      {/* Card Label */}
                      <View style={styles.cardMeta}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {note.title || 'Untitled Note'}
                        </Text>
                        <Text style={styles.cardDate}>{dateLabel}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Bottom Search & Action Bar */}
      <View style={styles.floatingBottomBar}>
        {/* Search Input Pill */}
        <View style={styles.searchPill}>
          <Search size={18} color={COLORS.appleGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={COLORS.appleGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Mic Button */}
        <TouchableOpacity style={styles.micBtn} onPress={onMicClick} activeOpacity={0.8}>
          <Mic size={20} color={COLORS.white} />
        </TouchableOpacity>

        {/* Compose Button */}
        <TouchableOpacity style={styles.composeBtn} onPress={onNewNote} activeOpacity={0.8}>
          <SquarePen size={20} color="#000000" />
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
    height: Platform.OS === 'android' ? 64 : 54,
    marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) : 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.appleNoteCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  syncedText: {
    fontSize: 11,
    color: COLORS.appleGray,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 95,
    gap: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.appleGray,
  },
  createFirstBtn: {
    backgroundColor: COLORS.appleOrange,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 6,
  },
  createFirstBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionWrap: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  cardItem: {
    width: CARD_WIDTH,
    gap: 6,
  },
  previewBox: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.appleNoteCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    overflow: 'hidden',
  },
  previewText: {
    fontSize: 11,
    color: '#d1d1d6',
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardMeta: {
    paddingHorizontal: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  cardDate: {
    fontSize: 13,
    color: COLORS.appleGray,
    marginTop: 2,
    fontWeight: '500',
  },
  floatingBottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 20 : 30,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 20,
  },
  searchPill: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.appleNoteCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 15,
  },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.appleNoteCard,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  composeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.appleOrange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.appleOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
