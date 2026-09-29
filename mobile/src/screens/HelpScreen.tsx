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

interface HelpScreenProps {
  onBackClick: () => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ onBackClick }) => {
  const faqs = [
    {
      q: 'How does voice capture work?',
      a: 'Tap the microphone icon, speak your ideas naturally, and UNSAID records your audio while the AI processes and transcribes it into structured notes.',
    },
    {
      q: 'How does AI organize thoughts?',
      a: 'The AI extracts titles, summaries, tags, and automatically categorizes each thought into taxonomies (Idea, Work, Study, Tech, etc.).',
    },
    {
      q: 'Where are my thoughts stored?',
      a: 'Audio files are stored locally on your device for absolute privacy. Text notes are saved locally and synced to your cloud account when connected.',
    },
    {
      q: 'Can I use UNSAID without an account?',
      a: 'Yes! Guest mode works completely offline. When you log in later, your offline thoughts are automatically claimed and migrated.',
    },
    {
      q: 'How do I delete my data?',
      a: 'Visit Settings -> Privacy & Data to wipe all local records, or request an account purge with a 7-day safety window.',
    },
    {
      q: 'Contact support',
      a: 'Need help or want to report a bug? Email support@thoughtcatcher.app.',
    },
  ];

  const handlePressFaq = (item: { q: string; a: string }) => {
    Alert.alert(item.q, item.a);
  };

  return (
    <CosmicBackground style={styles.container}>
      <AppHeader onBackClick={onBackClick} title="Help and Support" />

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

        {/* FAQs Stack */}
        <View style={styles.faqStack}>
          {faqs.map((faq, idx) => (
            <TouchableOpacity
              key={faq.q}
              style={[styles.faqRow, idx < faqs.length - 1 && styles.faqRowBorder]}
              onPress={() => handlePressFaq(faq)}
              activeOpacity={0.75}
            >
              <Text style={styles.faqText}>{faq.q}</Text>
              <ChevronRight size={20} color={COLORS.textMuted} />
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
  faqStack: {
    width: '100%',
    backgroundColor: 'rgba(3, 20, 32, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.3)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  faqRow: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 163, 255, 0.2)',
  },
  faqText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    paddingRight: 10,
  },
});
