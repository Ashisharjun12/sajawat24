import { Text } from '@/components/ui/text';
import { View } from 'react-native';

type HomeSectionHeadingProps = {
  title: string;
  subtitle?: string | null;
};

export function HomeSectionHeading({ title, subtitle }: HomeSectionHeadingProps) {
  return (
    <View className="gap-0.5">
      <Text className="text-foreground text-lg font-semibold leading-snug">{title}</Text>
      {subtitle ? (
        <Text className="text-muted-foreground text-sm leading-5">{subtitle}</Text>
      ) : null}
    </View>
  );
}
