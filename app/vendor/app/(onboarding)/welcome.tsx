import { Text } from '@/components/ui/text';
import { OnboardingButton } from '@/module/onboarding/components/OnboardingButton';
import { OnboardingDots } from '@/module/onboarding/components/OnboardingDots';
import { OnboardingSlide } from '@/module/onboarding/components/OnboardingSlide';
import { ONBOARDING_SLIDES } from '@/module/onboarding/lib/onboarding-copy';
import { useAuthStore } from '@/store/auth.store';
import { Href, router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeScreen() {
  const completeWelcome = useAuthStore((s) => s.completeWelcome);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<(typeof ONBOARDING_SLIDES)[number]>>(null);
  const isLast = index === ONBOARDING_SLIDES.length - 1;

  async function goToLoginChoice() {
    await completeWelcome();
    router.replace('/(onboarding)/login-choice' as Href);
  }

  function handleContinue() {
    if (!isLast) {
      const next = index + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
      return;
    }
    void goToLoginChoice();
  }

  function handleSkip() {
    void goToLoginChoice();
  }

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setIndex(next);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-end px-8 pb-2 pt-2">
        {!isLast ? (
          <Pressable onPress={handleSkip} hitSlop={8} accessibilityRole="button">
            <Text className="text-muted-foreground text-sm font-semibold">Skip</Text>
          </Pressable>
        ) : (
          <View className="h-5" />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={[...ONBOARDING_SLIDES]}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, itemIndex) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * itemIndex,
          index: itemIndex,
        })}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH }}>
            <OnboardingSlide slide={item} />
          </View>
        )}
      />

      <View className="px-8 pb-10 pt-4">
        <OnboardingDots count={ONBOARDING_SLIDES.length} index={index} />
        <OnboardingButton onPress={handleContinue}>
          <Text>{isLast ? 'Get started' : 'Continue'}</Text>
        </OnboardingButton>
      </View>
    </SafeAreaView>
  );
}
