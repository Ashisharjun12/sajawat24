import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getApiError } from '@/api/client';
import { useCompleteVendorJob } from '@/module/bookings/hooks/use-vendor-jobs';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DeliveryCompleteSheetProps = {
  open: boolean;
  onClose: () => void;
  orderId: string;
  onCompleted?: () => void;
};

export function DeliveryCompleteSheet({
  open,
  onClose,
  orderId,
  onCompleted,
}: DeliveryCompleteSheetProps) {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const completeMutation = useCompleteVendorJob(orderId);

  useEffect(() => {
    if (!open) {
      setCode('');
      setError('');
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [open]);

  function handleClose() {
    Keyboard.dismiss();
    setCode('');
    setError('');
    onClose();
  }

  async function handleSubmit() {
    const trimmed = code.replace(/\D/g, '').slice(0, 6);
    if (trimmed.length !== 6) {
      setError('Enter the 6-digit code from the customer');
      return;
    }
    setError('');
    try {
      await completeMutation.mutateAsync(trimmed);
      handleClose();
      onCompleted?.();
    } catch (err) {
      setError(getApiError(err));
    }
  }

  const sheetBottomPadding =
    Math.max(insets.bottom, 16) + (Platform.OS === 'android' ? keyboardHeight : 0);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={handleClose}>
          <Pressable
            className="rounded-t-3xl bg-background px-5 pt-6"
            style={{ paddingBottom: sheetBottomPadding }}
            onPress={() => {}}>
            <Text className="text-foreground text-lg font-semibold">Complete delivery</Text>
            <Text className="text-muted-foreground mt-2 text-sm leading-5">
              Ask the customer for the completion code sent to their phone, then enter it below.
            </Text>
            <TextInput
              className="mt-4 rounded-2xl border border-border bg-background px-4 py-3 text-center text-2xl tracking-[0.3em] text-foreground"
              value={code}
              onChangeText={(value) => {
                setCode(value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            {error ? <Text className="mt-2 text-sm text-destructive">{error}</Text> : null}
            <View className="mt-5 gap-2">
              <Button
                className="h-12 rounded-full"
                disabled={completeMutation.isPending}
                onPress={() => void handleSubmit()}>
                <Text>{completeMutation.isPending ? 'Completing…' : 'Complete delivery'}</Text>
              </Button>
              <Button className="h-12 rounded-full" variant="ghost" onPress={handleClose}>
                <Text>Cancel</Text>
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
