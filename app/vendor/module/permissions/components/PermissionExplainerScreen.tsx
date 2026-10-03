import { IconWell, Screen } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { syncPushRegistration } from '@/lib/push-registration';
import { requestNotificationPermission } from '@/lib/notifications';
import { saveNotificationPromptCompleted } from '@/lib/secure-storage';
import { useAuthStore } from '@/store/auth.store';
import { Bell } from 'lucide-react-native';
import { Href, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

export function PermissionExplainerScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [loading, setLoading] = useState(false);

  async function finish() {
    await saveNotificationPromptCompleted();
    router.replace('/(app)' as Href);
  }

  async function handleEnable() {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted && accessToken && userId) {
        await syncPushRegistration(accessToken, userId);
      }
    } finally {
      setLoading(false);
      await finish();
    }
  }

  async function handleMaybeLater() {
    await finish();
  }

  return (
    <Screen scroll={false} contentClassName="flex-1 justify-between pb-8">
      <View className="flex-1 items-center justify-center gap-6 px-2">
        <IconWell icon={Bell} size="lg" className="bg-primary/20" />
        <View className="gap-2">
          <Text className="text-foreground text-center text-2xl font-semibold">
            Stay on top of new jobs
          </Text>
          <Text className="text-muted-foreground text-center text-base leading-6">
            Get notified the moment Decoryy assigns you a booking so you never miss a job.
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <Button className="h-12 rounded-full" disabled={loading} onPress={() => void handleEnable()}>
          <Text>{loading ? 'Enabling…' : 'Enable notifications'}</Text>
        </Button>
        <Button
          className="h-12 rounded-full"
          variant="ghost"
          disabled={loading}
          onPress={() => void handleMaybeLater()}>
          <Text>Maybe later</Text>
        </Button>
      </View>
    </Screen>
  );
}
