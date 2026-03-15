import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function Toast({ message, visible, onHide, type = 'success' }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onHide?.());
    }
  }, [visible]);

  if (!visible) return null;

  const bgColor = type === 'success' ? colors.successBg : colors.dangerBg;
  const borderColor = type === 'success' ? colors.success : colors.danger;
  const textColor = type === 'success' ? colors.successText : colors.dangerText;

  return (
    <Animated.View
      style={[styles.container, { opacity, backgroundColor: bgColor, borderColor }]}
    >
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    zIndex: 999,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});
