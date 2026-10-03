import { Text } from '@/components/ui/text';
import type { ONBOARDING_SLIDES } from '@/module/onboarding/lib/onboarding-copy';
import { Image } from 'expo-image';
import { View } from 'react-native';

type OnboardingSlideProps = {
  slide: (typeof ONBOARDING_SLIDES)[number];
};

export function OnboardingSlide({ slide }: OnboardingSlideProps) {
  return (
    <View className="flex-1 px-6">
      <View className="min-h-0 flex-1 items-center justify-center pt-2">
        <Image
          source={{ uri: slide.imageUrl }}
          accessibilityLabel={slide.title}
          contentFit="contain"
          style={{ width: '100%', height: '100%', maxHeight: 420 }}
        />
      </View>

      <View className="max-w-full gap-3 pb-2 pt-6">
        <Text
          className="text-left text-foreground"
          style={{ fontSize: 30, lineHeight: 36, fontWeight: '700' }}>
          {slide.title}
        </Text>
        <Text className="text-muted-foreground text-left text-sm leading-5">{slide.description}</Text>
      </View>
    </View>
  );
}
