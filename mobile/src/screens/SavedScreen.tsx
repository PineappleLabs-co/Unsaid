import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { CosmicBackground } from '../components/CosmicBackground';
import { COLORS } from '../theme';

interface SavedScreenProps {
  onMenuClick: () => void;
  onViewThought: () => void;
  onCaptureAnother: () => void;
}

const { width } = Dimensions.get('window');

export const SavedScreen: React.FC<SavedScreenProps> = ({
  onMenuClick,
  onViewThought,
  onCaptureAnother,
}) => {
  return (
    <CosmicBackground style={styles.container}>
      <AppHeader onMenuClick={onMenuClick} />

      <View style={styles.content}>
        <View />

        {/* Center Brain Orb */}
        <View style={styles.centerOrbWrap}>
          <Image
            source={require('../../assets/brain_orb.png')}
            style={styles.orb}
            resizeMode="contain"
          />
        </View>

        {/* Title & Subtitle */}
        <View style={styles.textSection}>
          <Text style={styles.title}>Got it</Text>
          <Text style={styles.subtitle}>Your thought has been saved.</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onViewThought} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>View Thought</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineBtn} onPress={onCaptureAnother} activeOpacity={0.8}>
            <Text style={styles.outlineBtnText}>Capture Another</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  centerOrbWrap: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: width * 0.65,
    height: width * 0.65,
    maxWidth: 250,
    maxHeight: 250,
  },
  textSection: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  buttonSection: {
    width: '100%',
    gap: 14,
    marginTop: 20,
  },
  primaryBtn: {
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
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.bgBlack,
  },
  outlineBtn: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(12, 36, 54, 0.6)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.white,
  },
});
