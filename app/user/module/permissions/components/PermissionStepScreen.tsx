import { IconWell, Screen } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

type PermissionStepScreenProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  accentClassName?: string;
  loading?: boolean;
  onAllow: () => void;
  onSkip: () => void;
};

export function PermissionStepScreen({
  icon,
  title,
  description,
  accentClassName = 'bg-primary/20',
  loading = false,
  onAllow,
  onSkip,
}: PermissionStepScreenProps) {
  return (
    <Screen scroll={false} contentClassName="flex-1 justify-between px-4 pb-8">
      <View className="flex-1 items-center justify-center gap-6 px-2">
        <IconWell icon={icon} size="lg" className={accentClassName} />
        <View className="gap-2">
          <Text className="text-foreground text-center text-h1 font-semibold">{title}</Text>
          <Text className="text-muted-foreground text-center text-base leading-6">{description}</Text>
        </View>
      </View>

      <View className="gap-3">
        <Button variant="primary" className="w-full" loading={loading} onPress={onAllow}>
          <Text>Allow access</Text>
        </Button>
        <Button variant="text" className="w-full" disabled={loading} onPress={onSkip}>
          <Text>Not now</Text>
        </Button>
      </View>
    </Screen>
  );
}
