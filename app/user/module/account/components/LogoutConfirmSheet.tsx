import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { View } from 'react-native';

type LogoutConfirmSheetProps = {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function LogoutConfirmSheet({
  visible,
  loading = false,
  onClose,
  onConfirm,
}: LogoutConfirmSheetProps) {
  return (
    <HomeBottomSheetModal visible={visible} onClose={onClose} closeAccessibilityLabel="Close">
      <View className="gap-5 px-4">
        <View className="gap-1">
          <Text className="text-foreground text-h2 font-semibold">Log out?</Text>
          <Text className="text-muted-foreground text-body">
            Are you sure you want to log out? You can sign in again anytime.
          </Text>
        </View>
        <View className="gap-3">
          <Button variant="destructive" className="w-full" loading={loading} onPress={onConfirm}>
            <Text>Log out</Text>
          </Button>
          <Button variant="text" className="w-full" disabled={loading} onPress={onClose}>
            <Text>Cancel</Text>
          </Button>
        </View>
      </View>
    </HomeBottomSheetModal>
  );
}
