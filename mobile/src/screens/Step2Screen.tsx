import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { CosmicBackground } from '../components/CosmicBackground';
import { COLORS } from '../theme';

interface Step2ScreenProps {
  onNext: () => void;
  onBack: () => void;
}

const { width } = Dimensions.get('window');

export const Step2Screen: React.FC<Step2ScreenProps> = ({ onNext, onBack }) => {
  return (
    <CosmicBackground style={styles.container}>
      {/* Header Text */}
      <View style={styles.topSection}>
        <Text style={styles.title}>
          Say it.{'\n'}Don’t type it.
        </Text>
        <Text style={styles.subtitle}>
          Talk naturally we will capture it
        </Text>
      </View>

      {/* Center Artwork */}
      <View style={styles.centerSection}>
        <Image
          source={require('../../assets/step2_wave.png')}
          style={styles.artwork}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots & Navigation Arrows */}
        <View style={styles.paginationRow}>
          <TouchableOpacity style={styles.circleArrowBtnLeft} onPress={onBack} activeOpacity={0.8}>
            <ArrowLeft size={22} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.dotsContainer}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>

          <TouchableOpacity style={styles.circleArrowBtnRight} onPress={onNext} activeOpacity={0.8}>
            <ArrowRight size={22} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Primary Next Button */}
        <TouchableOpacity style={styles.button} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </CosmicBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  topSection: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  centerSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artwork: {
    width: width * 0.85,
    height: 180,
    maxWidth: 340,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 26,
  },
  paginationRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 48,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  dotActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.white,
    borderWidth: 0,
  },
  circleArrowBtnLeft: {
    position: 'absolute',
    left: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  circleArrowBtnRight: {
    position: 'absolute',
    right: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.bgBlack,
  },
});
