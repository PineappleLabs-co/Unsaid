import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '../theme';

interface CosmicBackgroundProps extends ViewProps {
  children: React.ReactNode;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.wrapper, style]} {...props}>
      <LinearGradient
        colors={GRADIENTS.cosmic}
        locations={[0, 0.45, 0.9]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#03070d',
  },
});
