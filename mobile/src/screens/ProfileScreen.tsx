import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Mail, User as UserIcon, LogOut, Pencil } from 'lucide-react-native';
import { AppHeader } from '../components/AppHeader';
import { CosmicBackground } from '../components/CosmicBackground';
import { UserProfile } from '../types';
import { COLORS } from '../theme';

interface ProfileScreenProps {
  user: UserProfile;
  onBackClick: () => void;
  onUpgradePlan: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onBackClick,
  onUpgradePlan,
  onLogout,
}) => {
  const isPro = user.plan === 'Pro';

  return (
    <CosmicBackground style={styles.container}>
      <AppHeader onBackClick={onBackClick} title="Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar with Edit Badge */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Image
              source={require('../../assets/brain_orb.png')}
              style={styles.avatarImg}
              resizeMode="contain"
            />
          </View>
          <View style={styles.editBadge}>
            <Pencil size={14} color={COLORS.white} />
          </View>
        </View>

        {/* User Name & Email */}
        <View style={styles.nameSection}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* Plan Badge Button */}
        <TouchableOpacity
          style={[styles.planBadgeBtn, isPro && styles.planBadgeBtnPro]}
          onPress={onUpgradePlan}
          activeOpacity={0.8}
        >
          <Text style={[styles.planBadgeText, isPro && styles.planBadgeTextPro]}>
            {isPro ? 'Pro Plan' : 'Free Plan'}
          </Text>
        </TouchableOpacity>

        {/* AI Credits Card */}
        <View style={styles.creditsCard}>
          <Text style={[styles.creditsTitle, isPro && styles.creditsTitlePro]}>AI Credits</Text>
          <Text style={styles.creditsSubtitle}>Used Credits {user.usedCreditsPercent}%</Text>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${user.usedCreditsPercent}%` }]} />
          </View>

          <Text style={styles.resetText}>Resets in 30 days</Text>
        </View>

        {/* User Details Stack */}
        <View style={styles.detailsStack}>
          {/* Email row */}
          <View style={[styles.detailRow, styles.detailRowBorder]}>
            <Mail size={22} color={COLORS.textMuted} />
            <View>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{user.email}</Text>
            </View>
          </View>

          {/* Username row */}
          <View style={styles.detailRow}>
            <UserIcon size={22} color={COLORS.textMuted} />
            <View>
              <Text style={styles.detailLabel}>Username</Text>
              <Text style={styles.detailValue}>{user.name}</Text>
            </View>
          </View>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
          <LogOut size={20} color={COLORS.bgBlack} />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
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
    gap: 18,
  },
  avatarWrap: {
    position: 'relative',
    marginTop: 6,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.cyanGlow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.cyanGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  avatarImg: {
    width: 110,
    height: 110,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#051b2a',
    borderWidth: 1.5,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSection: {
    alignItems: 'center',
    gap: 2,
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  planBadgeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.cyanGlow,
    backgroundColor: 'rgba(5, 25, 42, 0.6)',
  },
  planBadgeBtnPro: {
    borderColor: COLORS.proYellow,
  },
  planBadgeText: {
    color: COLORS.cyanGlow,
    fontSize: 15,
    fontWeight: '700',
  },
  planBadgeTextPro: {
    color: COLORS.proYellow,
  },
  creditsCard: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(7, 32, 51, 0.65)',
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    alignItems: 'center',
    gap: 10,
  },
  creditsTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.cyanGlow,
  },
  creditsTitlePro: {
    color: COLORS.proYellow,
  },
  creditsSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 10,
  },
  resetText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  detailsStack: {
    width: '100%',
    backgroundColor: 'rgba(3, 20, 32, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.3)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  detailRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 163, 255, 0.2)',
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  logoutBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.bgBlack,
  },
});
