import { IconWell } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { PartnerMode } from '@/lib/partner-mode';
import { Briefcase, Wrench } from 'lucide-react-native';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  open: boolean;
  targetMode: PartnerMode;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function copyForMode(targetMode: PartnerMode) {
  if (targetMode === 'field') {
    return {
      icon: Wrench,
      iconClassName: 'text-primary',
      wellClassName: 'bg-primary/15',
      title: 'Switch to worker mode?',
      body:
        'Worker mode only shows jobs assigned to you. On each booking in owner mode, tap “I’ll do this job” (or assign a team worker), then switch here. Owner tools like team and payouts are hidden until you switch back.',
      confirmLabel: 'Yes, switch to worker',
    };
  }

  return {
    icon: Briefcase,
    iconClassName: 'text-primary',
    wellClassName: 'bg-primary/15',
    title: 'Switch to owner mode?',
    body:
      'You’ll get the full shop dashboard—bookings, team, payouts, and catalog. Field-only views will be hidden.',
    confirmLabel: 'Yes, switch to owner',
  };
}

export function SwitchPartnerModeSheet({
  open,
  targetMode,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const sheetBottomPadding = Math.max(insets.bottom, 16);
  const copy = copyForMode(targetMode);

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      hardwareAccelerated={Platform.OS === 'android'}
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          className="bg-black/50"
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={loading ? undefined : onClose}
        />
        <View
          className="w-full rounded-t-3xl bg-background px-5 pt-6"
          style={[styles.sheet, { paddingBottom: sheetBottomPadding }]}>
          <View className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
          <View className="items-center gap-3">
            <IconWell
              icon={copy.icon}
              size="lg"
              className={copy.wellClassName}
              iconClassName={copy.iconClassName}
            />
            <Text className="text-foreground text-center text-xl font-semibold">{copy.title}</Text>
            <Text className="text-muted-foreground text-center text-sm leading-5">{copy.body}</Text>
          </View>

          <View className="mt-6 gap-3">
            <Button className="h-12 rounded-full" disabled={loading} onPress={onConfirm}>
              <Text className="font-semibold text-primary-foreground">
                {loading ? 'Switching…' : copy.confirmLabel}
              </Text>
            </Button>
            <Button
              className="h-11 rounded-full"
              variant="ghost"
              disabled={loading}
              onPress={onClose}>
              <Text className="font-medium">Not now</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
});
