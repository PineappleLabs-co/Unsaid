import { StyleSheet, Platform } from 'react-native';

export const COLORS = {
  bgTop: '#004b73',
  bgMid: '#00263e',
  bgBottom: '#03070d',
  bgBlack: '#000000',
  cardBg: 'rgba(7, 32, 51, 0.75)',
  cardBgDark: 'rgba(3, 16, 26, 0.85)',
  appleNoteCard: '#1c1c1e',
  
  white: '#ffffff',
  textMuted: '#8eb3cb',
  textSubtle: '#5a7d97',
  textLight: '#e2f1fd',
  
  cyanGlow: '#00d8ff',
  cyanBlue: '#00a3ff',
  cyanBadge: '#00dfc4',
  cyanBorder: 'rgba(0, 180, 255, 0.3)',
  
  proYellow: '#ffee00',
  appleOrange: '#ff9f0a',
  appleGray: '#8e8e93',
  appleRed: '#ff453a',
  danger: '#e62e2e',
};

export const GRADIENTS = {
  cosmic: ['#004b73', '#00263e', '#03070d'] as const,
  cosmicRadial: ['#003f63', '#001a2b', '#03070d'] as const,
  cardGlass: ['rgba(7, 32, 51, 0.85)', 'rgba(3, 16, 26, 0.95)'] as const,
  buttonPrimary: ['#ffffff', '#f0f0f0'] as const,
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBottom,
  },
  safeArea: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'android' ? 24 : 34,
  },
  btnPrimary: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  btnPrimaryText: {
    color: COLORS.bgBlack,
    fontSize: 18,
    fontWeight: '700',
  },
  btnOutline: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(12, 36, 54, 0.6)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  glassCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
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
  inputText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
});
