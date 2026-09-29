import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { CosmicBackground } from '../components/CosmicBackground';
import { api } from '../services/api';
import { COLORS } from '../theme';

interface LoginScreenProps {
  onLoginSuccess: (user: { email: string; name: string; token: string }) => void;
  onGoogle?: () => Promise<void>;
  onBack?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onGoogle,
  onBack,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.loginWithEmail(email.trim(), password);
      onLoginSuccess({
        email: res.email,
        name: email.split('@')[0],
        token: res.token,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    if (!onGoogle) return;
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Logo */}
          <View style={styles.topSection}>
            <Image
              source={require('../../assets/unsaid_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title & Subtitle */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              Make UNSAID{'\n'}yours.
            </Text>
            <Text style={styles.subtitle}>A space for your thoughts, your way.</Text>
          </View>

          {/* Error Card */}
          {errorMessage && (
            <View style={styles.errorCard}>
              <AlertCircle size={18} color="#ff8a8a" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Actions */}
          <View style={styles.formContainer}>
            {onGoogle && (
              <>
                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={handleGoogleClick}
                  disabled={loading || loadingGoogle}
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

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or sign in with email</Text>
                  <View style={styles.dividerLine} />
                </View>
              </>
            )}

            {/* Email Field */}
            <View style={styles.inputWrapper}>
              <Mail size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#6b8ca4"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputWrapper}>
              <Lock size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#6b8ca4"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={18} color={COLORS.textMuted} />
                ) : (
                  <Eye size={18} color={COLORS.textMuted} />
                )}
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading || loadingGoogle}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>Sign In / Register with Email</Text>
              )}
            </TouchableOpacity>

            {onBack && (
              <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  topSection: {
    marginTop: 10,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 44,
  },
  titleSection: {
    alignItems: 'center',
    gap: 10,
    marginVertical: 18,
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
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorCard: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
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
  formContainer: {
    width: '100%',
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerText: {
    color: COLORS.textSubtle,
    fontSize: 13,
  },
  inputWrapper: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(4, 20, 32, 0.85)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 12,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  submitBtn: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(12, 36, 54, 0.6)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  backBtn: {
    alignItems: 'center',
    padding: 6,
    marginTop: 4,
  },
  backBtnText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
