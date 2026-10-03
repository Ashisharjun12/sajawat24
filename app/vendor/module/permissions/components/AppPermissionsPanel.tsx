import { PressableScale } from '@/components/motion';
import { IconWell } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { syncPushRegistration } from '@/lib/push-registration';
import { requestForegroundLocationPermission } from '@/lib/location';
import { requestNotificationPermission } from '@/lib/notifications';
import type { PermissionVisualStatus } from '@/module/permissions/components/PermissionAccessCard';
import { useAppPermissions } from '@/module/permissions/hooks/use-app-permissions';
import { useAuthStore } from '@/store/auth.store';
import type { LucideIcon } from 'lucide-react-native';
import { Bell, ChevronRight, Map } from 'lucide-react-native';
import { Linking, View } from 'react-native';

function statusText(status: PermissionVisualStatus) {
  if (status === 'granted') return 'Allowed';
  if (status === 'denied') return 'Denied';
  return 'Not set';
}

function statusBadgeClass(status: PermissionVisualStatus) {
  if (status === 'granted') return 'bg-emerald-500/12 text-emerald-700';
  if (status === 'denied') return 'bg-amber-500/12 text-amber-800';
  return 'bg-muted text-muted-foreground';
}

type PermissionSettingRowProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  status: PermissionVisualStatus;
  accentClassName: string;
  onPress: () => void;
};

function PermissionSettingRow({
  icon,
  title,
  subtitle,
  status,
  accentClassName,
  onPress,
}: PermissionSettingRowProps) {
  return (
    <PressableScale onPress={onPress} className="flex-row items-center gap-3 py-3.5">
      <IconWell icon={icon} size="md" className={accentClassName} />
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-foreground text-base font-medium">{title}</Text>
        <Text className="text-muted-foreground text-sm leading-5">{subtitle}</Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <View className={cn('rounded-full px-2.5 py-1', statusBadgeClass(status))}>
          <Text className="text-[11px] font-semibold">{statusText(status)}</Text>
        </View>
        <Icon as={ChevronRight} className="text-muted-foreground size-4" />
      </View>
    </PressableScale>
  );
}

function SettingsDivider() {
  return <View className="h-px bg-border/40" />;
}

export function AppPermissionsPanel() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { notificationStatus, locationStatus, refresh } = useAppPermissions();

  async function handleNotificationPress() {
    if (notificationStatus === 'denied') {
      await Linking.openSettings();
      return;
    }

    const granted = await requestNotificationPermission();
    if (granted && accessToken && userId) {
      await syncPushRegistration(accessToken, userId);
    }
    await refresh();
  }

  async function handleLocationPress() {
    if (locationStatus === 'denied') {
      await Linking.openSettings();
      return;
    }

    await requestForegroundLocationPermission();
    await refresh();
  }

  const rows = [
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notifications',
      subtitle: 'Job alerts for new bookings',
      status: notificationStatus,
      accentClassName: 'bg-primary/20',
      onPress: () => void handleNotificationPress(),
    },
    {
      id: 'location',
      icon: Map,
      title: 'Location',
      subtitle: 'Share location when en route',
      status: locationStatus,
      accentClassName: 'bg-sky-500/15',
      onPress: () => void handleLocationPress(),
    },
  ];

  return (
    <View className="gap-2">
      <Text className="text-foreground text-base font-bold">Access</Text>

      <View>
        {rows.map((row, index) => (
          <View key={row.id}>
            <PermissionSettingRow
              icon={row.icon}
              title={row.title}
              subtitle={row.subtitle}
              status={row.status}
              accentClassName={row.accentClassName}
              onPress={row.onPress}
            />
            {index < rows.length - 1 ? <SettingsDivider /> : null}
          </View>
        ))}
      </View>

      <Text className="text-muted-foreground text-xs leading-5">
        Tap a permission to allow access or open system settings if access was denied.
      </Text>
    </View>
  );
}
