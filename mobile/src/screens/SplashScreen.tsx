import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { CosmicBackground } from '../components/CosmicBackground';
import { COLORS } from '../theme';

interface SplashScreenProps {
  onGetStarted: () => void;
}

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
  return (
    <CosmicBackground style={styles.container}>
      {/* Top UNSAID Logo */}
      <View style={styles.topSection}>
        <Image
          source={require('../../assets/unsaid_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Center Brain Orb */}
      <View style={styles.centerSection}>
        <Image
          source={require('../../assets/brain_orb.png')}
          style={styles.orb}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Text & Button */}
      <View style={styles.bottomSection}>
        <Text style={styles.title}>
          Had a thought?{'\n'}Capture it before it disappears.
        </Text>

        <TouchableOpacity style={styles.button} onPress={onGetStarted} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Get Started</Text>
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
  },
  logo: {
    width: 220,
    height: 48,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: width * 0.65,
    height: width * 0.65,
    maxWidth: 260,
    maxHeight: 260,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 30,
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
