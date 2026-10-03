import { Platform, type ScrollViewProps } from 'react-native';

/** Shared vertical scroll feel for feed screens (native). */
export const smoothScrollViewProps: Partial<ScrollViewProps> = {
  showsVerticalScrollIndicator: false,
  nestedScrollEnabled: true,
  overScrollMode: 'always',
  decelerationRate: Platform.OS === 'ios' ? 'normal' : undefined,
  keyboardShouldPersistTaps: 'handled',
};
