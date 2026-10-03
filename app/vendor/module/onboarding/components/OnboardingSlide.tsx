import { Text } from '@/components/ui/text';
import type { ONBOARDING_SLIDES } from '@/module/onboarding/lib/onboarding-copy';
import { Image } from 'expo-image';
import { View } from 'react-native';

type OnboardingSlideProps = {
  slide: (typeof ONBOARDING_SLIDES)[number];
};

export function OnboardingSlide({ slide }: OnboardingSlideProps) {
  return (
    <View className="flex-1 justify-center px-8 pb-4">
      <Image
        source={{ uri: slide.imageUrl }}
        accessibilityLabel={slide.title}
        contentFit="contain"
        style={{ width: '100%', maxWidth: 300, height: 220, marginBottom: 28, alignSelf: 'center' }}
      />

      <View className="max-w-[340px] gap-4 self-center px-2">
        <Text
          className="text-center text-foreground"
          style={{ fontSize: 32, lineHeight: 38, fontWeight: '700' }}>
          {slide.title}
        </Text>
        <Text className="text-muted-foreground text-center text-base leading-6">
          {slide.description}
        </Text>
      </View>
    </View>
  );
}
