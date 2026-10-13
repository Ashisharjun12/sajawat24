import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { View } from 'react-native';

type DeleteAccountConfirmSheetProps = {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteAccountConfirmSheet({
  visible,
  loading = false,
  onClose,
  onConfirm,
}: DeleteAccountConfirmSheetProps) {
  return (
    <HomeBottomSheetModal visible={visible} onClose={onClose} closeAccessibilityLabel="Close">
      <View className="gap-5 px-4">
        <View className="gap-2">
          <Text className="text-foreground text-h2 font-semibold">Delete your account?</Text>
          <Text className="text-muted-foreground text-body">
            You will be signed out on all devices immediately. Past orders may be kept for records.
            You can create a new account later with the same phone number.
          </Text>
        </View>
        <View className="gap-3">
          <Button variant="destructive" className="w-full" loading={loading} onPress={onConfirm}>
            <Text>Delete account</Text>
          </Button>
          <Button variant="text" className="w-full" disabled={loading} onPress={onClose}>
            <Text>Cancel</Text>
          </Button>
        </View>
      </View>
    </HomeBottomSheetModal>
  );
}
