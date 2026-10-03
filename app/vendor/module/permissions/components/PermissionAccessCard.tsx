import { IconWell, Surface } from '@/components/shell';
import { PressableScale } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

export type PermissionVisualStatus = 'granted' | 'denied' | 'undetermined';

function statusLabel(status: PermissionVisualStatus) {
  if (status === 'granted') return 'Enabled';
  if (status === 'denied') return 'Not enabled';
  return 'Not set';
}

function statusClass(status: PermissionVisualStatus) {
  if (status === 'granted') return 'bg-emerald-500/15 text-emerald-800';
  if (status === 'denied') return 'bg-amber-500/15 text-amber-900';
  return 'bg-muted text-muted-foreground';
}

type PermissionAccessCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  status: PermissionVisualStatus;
  onEnable: () => void;
  onOpenSettings?: () => void;
  loading?: boolean;
  className?: string;
  accentClassName?: string;
};

export function PermissionAccessCard({
  icon,
  title,
  description,
  status,
  onEnable,
  onOpenSettings,
  loading = false,
  className,
  accentClassName = 'bg-primary/12',
}: PermissionAccessCardProps) {
  const granted = status === 'granted';
  const denied = status === 'denied';

  return (
    <Surface className={cn('gap-4 p-4', className)}>
      <View className="flex-row items-start gap-3">
        <IconWell icon={icon} size="lg" className={accentClassName} />
        <View className="flex-1 gap-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-foreground text-base font-semibold">{title}</Text>
            <View className={cn('rounded-full px-2.5 py-0.5', statusClass(status))}>
              <Text className="text-[11px] font-medium">{statusLabel(status)}</Text>
            </View>
          </View>
          <Text className="text-muted-foreground text-sm leading-5">{description}</Text>
        </View>
      </View>

      {granted ? null : denied && onOpenSettings ? (
        <PressableScale onPress={onOpenSettings}>
          <Text className="text-sm font-medium text-primary">Open Settings</Text>
        </PressableScale>
      ) : (
        <Button
          className="h-10 rounded-full"
          variant={denied ? 'secondary' : 'default'}
          disabled={loading}
          onPress={onEnable}>
          <Text>{loading ? 'Please wait…' : granted ? 'Enabled' : 'Allow access'}</Text>
        </Button>
      )}
    </Surface>
  );
}
