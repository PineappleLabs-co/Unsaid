import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Mail, AlertCircle } from 'lucide-react-native';
import { CosmicBackground } from '../components/CosmicBackground';
import { COLORS } from '../theme';

interface AccountScreenProps {
  onGoogle: () => Promise<void>;
  onEmail: () => void;
  onGuest: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  onGoogle,
  onEmail,
  onGuest,
}) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleClick = async () => {
    setLoadingGoogle(true);
    setErrorMessage(null);
    try {
      await onGoogle();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <CosmicBackground style={styles.container}>
      {/* Top Logo */}
      <View style={styles.topSection}>
        <Image
          source={require('../../assets/unsaid_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Middle Text */}
      <View style={styles.middleSection}>
        <Text style={styles.title}>
          Keep your{'\n'}thoughts close.
        </Text>
        <Text style={styles.subtitle}>
          Sync across devices{'\n'}and never lose a thought.
        </Text>
      </View>

      {/* Error Message */}
      {errorMessage && (
        <View style={styles.errorCard}>
          <AlertCircle size={18} color="#ff8a8a" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Bottom Buttons */}
      <View style={styles.bottomSection}>
        {/* Google Sign In */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleClick}
          disabled={loadingGoogle}
          activeOpacity={0.85}
        >
          {loadingGoogle ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Image
                source={require('../../assets/favicon.png')}
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Email Sign In */}
        <TouchableOpacity
          style={styles.emailBtn}
          onPress={onEmail}
          disabled={loadingGoogle}
          activeOpacity={0.8}
        >
          <Mail size={20} color={COLORS.white} />
          <Text style={styles.emailBtnText}>Continue with Email</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Continue as Guest */}
        <TouchableOpacity
          onPress={onGuest}
          disabled={loadingGoogle}
          style={styles.guestBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.guestBtnText}>Continue as guest</Text>
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
  middleSection: {
    alignItems: 'center',
    gap: 14,
    marginVertical: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorCard: {
    width: '100%',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#ff8a8a',
    fontSize: 13,
    flex: 1,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  googleBtn: {
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
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.bgBlack,
  },
  emailBtn: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(12, 36, 54, 0.6)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emailBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.white,
  },
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerText: {
    color: COLORS.textSubtle,
    fontSize: 15,
  },
  guestBtn: {
    padding: 6,
  },
  guestBtnText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});
