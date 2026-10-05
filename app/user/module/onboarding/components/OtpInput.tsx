import { Text } from '@/components/ui/text';
import { space } from '@/lib/design-tokens';
import { useThemeColors } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import { Platform, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

const BOX_WIDTH = 48;
const BOX_HEIGHT = 56;
const GAP = space[2];
const SCREEN_PADDING = space[4];

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  className?: string;
};

export function OtpInput({ value, onChange, length = 6, className }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const theme = useThemeColors();
  const { width: windowWidth } = useWindowDimensions();
  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  // Shrink only when six boxes cannot fit inside the screen padding.
  const available = windowWidth - SCREEN_PADDING * 2 - (length - 1) * GAP;
  const boxWidth = Math.min(BOX_WIDTH, Math.floor(available / length));

  function handleChange(text: string) {
    const cleaned = text.replace(/\D/g, '').slice(0, length);
    onChange(cleaned);
  }

  const containerWidth = length * boxWidth + (length - 1) * GAP;

  return (
    <View className={cn(className)} style={[styles.container, { width: containerWidth }]}>
      <View pointerEvents="none" style={styles.row}>
        {digits.map((digit, index) => {
          const isActive = value.length === index;
          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  width: boxWidth,
                  backgroundColor: theme.card,
                  borderColor: isActive ? theme.primary : theme.border,
                  borderWidth: isActive ? 2 : 1,
                },
              ]}>
              <Text className="text-h2 font-semibold text-foreground">{digit}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
        caretHidden
        showSoftInputOnFocus
        textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : undefined}
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        importantForAutofill={Platform.OS === 'android' ? 'yes' : undefined}
        style={styles.overlayInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
    height: BOX_HEIGHT,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  box: {
    height: BOX_HEIGHT,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    fontSize: 16,
    color: 'transparent',
  },
});
