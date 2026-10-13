import { IconWell, Screen } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

type PermissionStepScreenProps = {
  icon?: LucideIcon;
  illustrationUri?: string;
  illustrationLabel?: string;
  title: string;
  description: string;
  accentClassName?: string;
  allowLabel?: string;
  skipLabel?: string;
  loading?: boolean;
  onAllow: () => void;
  onSkip: () => void;
};

export function PermissionStepScreen({
  icon,
  illustrationUri,
  illustrationLabel,
  title,
  description,
  accentClassName = 'bg-primary/20',
  allowLabel = 'Allow access',
  skipLabel = 'Not now',
  loading = false,
  onAllow,
  onSkip,
}: PermissionStepScreenProps) {
  const showIcon = Boolean(icon) && !illustrationUri;

  return (
    <Screen scroll={false} contentClassName="flex-1 justify-between px-4 pb-8">
      <View className="flex-1 items-center justify-center gap-6 px-1 pt-4">
        {illustrationUri ? (
          <View className="w-full max-w-sm items-center">
            <Image
              source={{ uri: illustrationUri }}
              style={{ width: '100%', aspectRatio: 1 }}
              contentFit="contain"
              accessibilityLabel={illustrationLabel ?? title}
            />
          </View>
        ) : null}
        {showIcon && icon ? (
          <IconWell icon={icon} size="lg" className={accentClassName} />
        ) : null}
        <View className="max-w-sm gap-2">
          <Text className="text-foreground text-center text-h1 font-semibold">{title}</Text>
          <Text className="text-muted-foreground text-center text-body leading-6">{description}</Text>
        </View>
      </View>

      <View className="gap-3">
        <Button variant="primary" className="w-full" loading={loading} onPress={onAllow}>
          <Text>{allowLabel}</Text>
        </Button>
        <Button variant="text" className="w-full" disabled={loading} onPress={onSkip}>
          <Text>{skipLabel}</Text>
        </Button>
      </View>
    </Screen>
  );
}
