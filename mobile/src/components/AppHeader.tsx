import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { Menu, ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../theme';

interface AppHeaderProps {
  onMenuClick?: () => void;
  onBackClick?: () => void;
  title?: string;
  showLogo?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onMenuClick,
  onBackClick,
  title,
  showLogo = true,
}) => {
  return (
    <View style={styles.header}>
      {onBackClick ? (
        <TouchableOpacity style={styles.iconBtn} onPress={onBackClick} activeOpacity={0.7}>
          <ChevronLeft size={28} color={COLORS.white} strokeWidth={2.5} />
        </TouchableOpacity>
      ) : onMenuClick ? (
        <TouchableOpacity style={styles.iconBtn} onPress={onMenuClick} activeOpacity={0.7}>
          <Menu size={26} color={COLORS.white} strokeWidth={2} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : showLogo ? (
        <Image
          source={require('../../assets/unsaid_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.placeholder} />
      )}

      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: Platform.OS === 'android' ? 60 : 54,
    marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) : 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    zIndex: 40,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  logo: {
    height: 24,
    width: 140,
  },
});
