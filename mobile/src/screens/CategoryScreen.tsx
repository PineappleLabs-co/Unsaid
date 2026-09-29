import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
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
} from 'lucide-react-native';
import { AppHeader } from '../components/AppHeader';
import { CosmicBackground } from '../components/CosmicBackground';
import { CategoryId } from '../types';
import { COLORS } from '../theme';

interface CategoryScreenProps {
  onMenuClick: () => void;
  onSelectCategory: (category: CategoryId) => void;
}

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 48 - 28) / 3;

export const CategoryScreen: React.FC<CategoryScreenProps> = ({
  onMenuClick,
  onSelectCategory,
}) => {
  const [selected, setSelected] = useState<CategoryId>('Idea');
  const [selectedTag, setSelectedTag] = useState<string>('Product Idea');

  const categories: { id: CategoryId; label: string; icon: any }[] = [
    { id: 'Idea', label: 'Idea', icon: Lightbulb },
    { id: 'Study', label: 'Study', icon: BookOpen },
    { id: 'Work', label: 'Work', icon: Briefcase },
    { id: 'Personal', label: 'Personal', icon: User },
    { id: 'Health', label: 'Health', icon: Heart },
    { id: 'Finance', label: 'Finance', icon: TrendingUp },
    { id: 'Creative', label: 'Creative', icon: Palette },
    { id: 'Tech', label: 'Tech', icon: Code },
    { id: 'Others', label: 'Others', icon: MoreHorizontal },
  ];

  const aiSuggestions = ['Product Idea', 'App Development', 'UI/UX'];

  return (
    <CosmicBackground style={styles.container}>
      <AppHeader onMenuClick={onMenuClick} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>What’s this about?</Text>
          <Text style={styles.subtitle}>Choose your theme or let AI Suggest.</Text>
        </View>

        {/* 3x3 Category Grid */}
        <View style={styles.grid}>
          {categories.map((cat) => {
            const isActive = selected === cat.id;
            const IconComponent = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.tile, isActive && styles.tileActive]}
                onPress={() => setSelected(cat.id)}
                activeOpacity={0.75}
              >
                <IconComponent size={28} color={COLORS.cyanGlow} strokeWidth={2} />
                <Text style={[styles.tileLabel, isActive && styles.tileLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* AI Suggestion */}
        <View style={styles.aiSection}>
          <Text style={styles.aiHeader}>AI Suggestion</Text>
          <View style={styles.tagRow}>
            {aiSuggestions.map((tag) => {
              const isTagActive = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagPill, isTagActive && styles.tagPillActive]}
                  onPress={() => setSelectedTag(tag)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tagText, isTagActive && styles.tagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => onSelectCategory(selected)}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </CosmicBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  titleSection: {
    alignItems: 'center',
    marginVertical: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
    marginBottom: 20,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: 'rgba(6, 28, 44, 0.75)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tileActive: {
    backgroundColor: 'rgba(0, 180, 255, 0.18)',
    borderColor: COLORS.cyanGlow,
    shadowColor: COLORS.cyanGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b0cee0',
  },
  tileLabelActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  aiSection: {
    marginBottom: 24,
  },
  aiHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagPill: {
    backgroundColor: 'rgba(8, 30, 48, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.3)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tagPillActive: {
    backgroundColor: 'rgba(0, 180, 255, 0.25)',
    borderColor: COLORS.cyanGlow,
  },
  tagText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tagTextActive: {
    color: COLORS.cyanGlow,
  },
  continueBtn: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 'auto',
  },
  continueBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.bgBlack,
  },
});
