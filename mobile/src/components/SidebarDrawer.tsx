import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { ScreenId } from '../types';
import { COLORS } from '../theme';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenProPlan: () => void;
}

const { width } = Dimensions.get('window');

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenProPlan,
}) => {
  const menuItems = [
    { label: 'Capture', action: () => onNavigate('record') },
    { label: 'Notes', action: () => onNavigate('notes') },
    { label: 'AI Credits', action: () => onOpenProPlan() },
    { label: 'Profile', action: () => onNavigate('profile') },
    { label: 'Settings', action: () => onNavigate('privacy') },
    { label: 'Help and Support', action: () => onNavigate('help') },
    { label: 'Privacy and Data', action: () => onNavigate('privacy') },
    { label: 'About', action: () => onNavigate('about') },
  ];

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.drawerPanel}>
          <Text style={styles.headerTitle}>Navigate</Text>

          <View style={styles.menuList}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  item.action();
                  onClose();
                }}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  drawerPanel: {
    width: Math.min(width * 0.75, 300),
    height: '100%',
    backgroundColor: '#021827',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 180, 255, 0.25)',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 40 : 60,
    paddingHorizontal: 26,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  menuList: {
    gap: 22,
  },
  menuItem: {
    paddingVertical: 4,
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94b3c7',
  },
});
