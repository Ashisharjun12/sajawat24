import { View } from 'react-native';

type OnboardingDotsProps = {
  count: number;
  index: number;
};

export function OnboardingDots({ count, index }: OnboardingDotsProps) {
  return (
    <View className="mb-4 flex-row items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, dotIndex) => (
        <View
          key={dotIndex}
          className={
            dotIndex === index
              ? 'bg-primary h-2 w-6 rounded-full'
              : 'bg-muted h-2 w-2 rounded-full'
          }
        />
      ))}
    </View>
  );
}
