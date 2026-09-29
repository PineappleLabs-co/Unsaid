import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { COLORS } from '../theme';

interface WaveformVisualizerProps {
  isActive: boolean;
  progressPercent?: number; // 0 to 1
}

const BAR_HEIGHTS = [10, 18, 26, 14, 24, 32, 18, 12, 22, 28, 16, 26, 34, 20, 14, 26, 30, 18, 12, 22, 16, 24, 28];

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isActive,
  progressPercent = 0,
}) => {
  const animValues = useRef(BAR_HEIGHTS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isActive) {
      const animations = animValues.map((val, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(val, {
              toValue: 1,
              duration: 250 + (i % 5) * 60,
              useNativeDriver: false,
            }),
            Animated.timing(val, {
              toValue: 0,
              duration: 250 + (i % 5) * 60,
              useNativeDriver: false,
            }),
          ])
        )
      );
      animLoop = Animated.parallel(animations);
      animLoop.start();
    } else {
      animValues.forEach((val) => val.setValue(0));
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isActive]);

  const activeIndex = Math.floor(progressPercent * BAR_HEIGHTS.length);

  return (
    <View style={styles.container}>
      {BAR_HEIGHTS.map((baseHeight, idx) => {
        const isPast = idx <= activeIndex && progressPercent > 0;
        const height = animValues[idx].interpolate({
          inputRange: [0, 1],
          outputRange: [baseHeight, Math.min(38, baseHeight + 14)],
        });

        return (
          <Animated.View
            key={idx}
            style={[
              styles.bar,
              {
                height: isActive ? height : baseHeight,
                backgroundColor: isPast ? COLORS.cyanGlow : COLORS.white,
                opacity: isPast ? 1 : 0.45,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
  },
});
