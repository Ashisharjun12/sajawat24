import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

const BOX_SIZE = 46;
const BOX_HEIGHT = BOX_SIZE + 4;
const GAP = 8;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  className?: string;
};

export function OtpInput({ value, onChange, length = 6, className }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  function handleChange(text: string) {
    const cleaned = text.replace(/\D/g, '').slice(0, length);
    onChange(cleaned);
  }

  const containerWidth = length * BOX_SIZE + (length - 1) * GAP;

  return (
    <View className={cn(className)} style={[styles.container, { width: containerWidth }]}>
      <View pointerEvents="none" style={styles.row}>
        {digits.map((digit, index) => {
          const isActive = value.length === index;
          const isFilled = digit.length > 0;
          return (
            <View
              key={index}
              style={[
                styles.box,
                isActive && styles.boxActive,
                isFilled && !isActive && styles.boxFilled,
              ]}>
              <Text style={styles.digit}>{digit}</Text>
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
    width: BOX_SIZE,
    height: BOX_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderWidth: 2,
    borderColor: '#18181B',
  },
  boxFilled: {
    borderColor: '#A1A1AA',
  },
  digit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#18181B',
  },
  overlayInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    fontSize: 16,
    color: 'transparent',
  },
});
