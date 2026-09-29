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
import { Mic, Trash2, UserX, ChevronRight } from 'lucide-react-native';
import { AppHeader } from '../components/AppHeader';
import { CosmicBackground } from '../components/CosmicBackground';
import { COLORS } from '../theme';

interface PrivacyScreenProps {
  onBackClick: () => void;
  onDeleteAllThoughts: () => void;
}

export const PrivacyScreen: React.FC<PrivacyScreenProps> = ({
  onBackClick,
  onDeleteAllThoughts,
}) => {
  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Thoughts',
      'Are you sure you want to permanently delete all captured thoughts? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All', style: 'destructive', onPress: onDeleteAllThoughts },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Your account will be soft-deleted immediately with a 7-day grace period. You can restore your data by logging back in within 7 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Scheduled', 'Account deletion scheduled. Your data will be wiped after 7 days.');
          },
        },
      ]
    );
  };

  return (
    <CosmicBackground style={styles.container}>
      <AppHeader onBackClick={onBackClick} title="Privacy and Data" />

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

        {/* Privacy Options Stack */}
        <View style={styles.optionsStack}>
          {/* Audio Retention */}
          <TouchableOpacity
            style={[styles.optionRow, styles.optionRowBorder]}
            onPress={() => Alert.alert('Audio Retention', 'Audio recordings are kept locally for 30 days and never transmitted to cloud databases.')}
            activeOpacity={0.75}
          >
            <Mic size={24} color={COLORS.white} />
            <View style={styles.optionMeta}>
              <Text style={styles.optionTitle}>Audio Retention</Text>
              <Text style={styles.optionSubtitle}>Keep it for 30 days</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Delete All Thoughts */}
          <TouchableOpacity
            style={[styles.optionRow, styles.optionRowBorder]}
            onPress={handleDeleteAll}
            activeOpacity={0.75}
          >
            <Trash2 size={24} color={COLORS.white} />
            <Text style={styles.optionTitleFull}>Delete All Thoughts</Text>
            <ChevronRight size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.75}
          >
            <UserX size={24} color={COLORS.white} />
            <Text style={styles.optionTitleFull}>Delete Account</Text>
            <ChevronRight size={20} color={COLORS.textMuted} />
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
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 30,
    gap: 22,
  },
  logoSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
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
  },
  optionRow: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 163, 255, 0.2)',
  },
  optionMeta: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  optionSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  optionTitleFull: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
});
