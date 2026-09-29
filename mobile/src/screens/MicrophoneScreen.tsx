import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { CosmicBackground } from '../components/CosmicBackground';
import { audioService } from '../services/audioService';
import { COLORS } from '../theme';

interface MicrophoneScreenProps {
  onAllowMicrophone: () => void;
  onNext: () => void;
}

const { width } = Dimensions.get('window');

export const MicrophoneScreen: React.FC<MicrophoneScreenProps> = ({
  onAllowMicrophone,
  onNext,
}) => {
  const handleAllow = async () => {
    try {
      await audioService.requestPermission();
    } catch (e) {
      console.log('Mic permission request notice:', e);
    }
    onAllowMicrophone();
  };

  return (
    <CosmicBackground style={styles.container}>
      {/* Title & Subtitle */}
      <View style={styles.topSection}>
        <Text style={styles.title}>
          Give your{'\n'}thoughts a voice.
        </Text>
        <Text style={styles.subtitle}>
          Allow microphone access{'\n'}to capture thoughts hassle free
        </Text>
      </View>

      {/* Center Artwork */}
      <View style={styles.centerSection}>
        <Image
          source={require('../../assets/mic_orb.png')}
          style={styles.artwork}
          resizeMode="contain"
        />
      </View>

      {/* Buttons */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.button} onPress={handleAllow} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Allow Microphone</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNext} style={styles.nextBtn} activeOpacity={0.7}>
          <Text style={styles.nextBtnText}>Next</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  artwork: {
    width: width * 0.7,
    height: width * 0.7,
    maxWidth: 270,
    maxHeight: 270,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 18,
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
  nextBtn: {
    padding: 6,
  },
  nextBtnText: {
    color: COLORS.textMuted,
    fontSize: 17,
    fontWeight: '600',
  },
});
