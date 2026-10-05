import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/lib/theme';
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

type TypingIndicatorProps = {
  align?: 'left' | 'right';
};

const DOT_SIZE = 4;

export function TypingIndicator({ align = 'left' }: TypingIndicatorProps) {
  const theme = useThemeColors();
  const dot1 = useRef(new Animated.Value(0.35)).current;
  const dot2 = useRef(new Animated.Value(0.35)).current;
  const dot3 = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.35, duration: 320, useNativeDriver: true }),
        ]),
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 120);
    const a3 = animate(dot3, 240);
    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View className={`flex-row ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      <View className="flex-row items-center gap-1.5 rounded-pill bg-muted px-2.5 py-1.5">
        <View className="flex-row items-center gap-0.5">
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View
              key={i}
              style={{
                opacity: dot,
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: DOT_SIZE / 2,
                backgroundColor: theme.mutedForeground,
              }}
            />
          ))}
        </View>
        <Text className="text-micro text-muted-foreground">typing…</Text>
      </View>
    </View>
  );
}
