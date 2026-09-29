import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { AppHeader } from '../components/AppHeader';
import { CosmicBackground } from '../components/CosmicBackground';
import { COLORS } from '../theme';

interface AboutScreenProps {
  onBackClick: () => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ onBackClick }) => {
  const items = ['Terms of Service', 'Privacy Policy', 'Open Source Licenses'];

  const handlePressItem = (item: string) => {
    Alert.alert(item, `${item} for UNSAID Thought Catcher v1.0.0.`);
  };

  return (
    <CosmicBackground style={styles.container}>
      <AppHeader onBackClick={onBackClick} title="About" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo & Version */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/unsaid_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subLogoText}>Thoughts Captured</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        {/* Options Stack */}
        <View style={styles.optionsStack}>
          {items.map((item, idx) => (
            <TouchableOpacity
              key={item}
              style={[styles.optionRow, idx < items.length - 1 && styles.optionRowBorder]}
              onPress={() => handlePressItem(item)}
              activeOpacity={0.75}
            >
              <Text style={styles.optionText}>{item}</Text>
              <ChevronRight size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
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
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 30,
    gap: 26,
  },
  logoSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  logo: {
    width: 180,
    height: 42,
  },
  subLogoText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '700',
  },
  optionsStack: {
    width: '100%',
    backgroundColor: 'rgba(3, 20, 32, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.3)',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
  },
  optionRow: {
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 163, 255, 0.2)',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
});
