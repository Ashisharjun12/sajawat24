import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

export function triggerHaptic(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
) {
  void Haptics.impactAsync(style);
}

export function useHapticPress(onPress?: () => void) {
  return useCallback(() => {
    triggerHaptic();
    onPress?.();
  }, [onPress]);
}
