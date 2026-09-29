import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { FileText, Search, CheckSquare, Sparkles } from 'lucide-react-native';
import { AppHeader } from '../components/AppHeader';
import { CosmicBackground } from '../components/CosmicBackground';
import { Thought } from '../types';
import { COLORS } from '../theme';

interface TakeFurtherModalProps {
  thought: Thought;
  onBack: () => void;
  onGenerateAI: (option: string) => void;
}

const { width } = Dimensions.get('window');

export const TakeFurtherModal: React.FC<TakeFurtherModalProps> = ({
  thought,
  onBack,
  onGenerateAI,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('plan');

  const options = [
    {
      id: 'plan',
      title: 'Create a structured plan',
      subtitle: 'Turn your thoughts into actionable plans',
      icon: FileText,
    },
    {
      id: 'research',
      title: 'Research Insights',
      subtitle: 'Get relevant information and context',
      icon: Search,
    },
    {
      id: 'features',
      title: 'Suggested Features',
      subtitle: 'Find ideas and improvements',
      icon: CheckSquare,
    },
    {
      id: 'summary',
      title: 'Organize and summarize',
      subtitle: 'Make your thoughts clear and complete',
      icon: Sparkles,
    },
  ];

  return (
    <CosmicBackground style={styles.container}>
      <AppHeader onBackClick={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brain Orb */}
        <View style={styles.orbWrap}>
          <Image
            source={require('../../assets/brain_orb.png')}
            style={styles.orb}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Take This Thought Further ?</Text>
          <Text style={styles.subtitle}>
            Let AI help you expand, organize and turn this into a detailed plan.
          </Text>
        </View>

        {/* Options Stack */}
        <View style={styles.optionsContainer}>
          {options.map((opt, idx) => {
            const isSelected = selectedOption === opt.id;
            const IconComponent = opt.icon;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionRow,
                  isSelected && styles.optionRowSelected,
                  idx < options.length - 1 && styles.optionBorderBottom,
                ]}
                onPress={() => setSelectedOption(opt.id)}
                activeOpacity={0.75}
              >
                <IconComponent
                  size={24}
                  color={isSelected ? COLORS.cyanGlow : COLORS.white}
                  strokeWidth={2}
                />
                <View style={styles.optionMeta}>
                  <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                    {opt.title}
                  </Text>
                  <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Generate Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={() => onGenerateAI(selectedOption)}
            activeOpacity={0.85}
          >
            <Text style={styles.generateBtnText}>Generate with AI</Text>
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
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  orbWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  orb: {
    width: width * 0.45,
    height: width * 0.45,
    maxWidth: 180,
    maxHeight: 180,
  },
  titleSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  optionsContainer: {
    width: '100%',
    backgroundColor: 'rgba(3, 20, 32, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.3)',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  optionRow: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionRowSelected: {
    backgroundColor: 'rgba(0, 180, 255, 0.18)',
  },
  optionBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 163, 255, 0.15)',
  },
  optionMeta: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  optionTitleSelected: {
    color: COLORS.cyanGlow,
  },
  optionSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  bottomSection: {
    gap: 14,
  },
  generateBtn: {
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
  generateBtnText: {
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
