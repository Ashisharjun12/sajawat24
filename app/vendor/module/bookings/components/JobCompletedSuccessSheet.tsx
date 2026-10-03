import { IconWell } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatInr } from '@/module/bookings/lib/booking-format';
import { CheckCircle2, Wallet } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type JobCompletedSuccessSheetProps = {
  open: boolean;
  onClose: () => void;
  paymentMethod: string;
  collectionMethod?: string | null;
  vendorSharePaise?: number | null;
};

function successCopy(
  paymentMethod: string,
  collectionMethod: string | null | undefined,
  vendorSharePaise: number | null | undefined,
) {
  const isCod = paymentMethod === 'COD';
  const isCashCod = isCod && collectionMethod === 'cash';

  if (isCashCod) {
    return {
      title: 'Delivery complete',
      body:
        vendorSharePaise != null
          ? `You collected cash for this booking. Platform commission will appear under COD dues in your wallet.`
          : 'You collected cash for this booking. Your wallet will update shortly with any COD commission due.',
      highlight: null,
    };
  }

  if (vendorSharePaise != null && vendorSharePaise > 0) {
    return {
      title: 'You earned it',
      body: 'Your available balance will update shortly. Open Wallet to see your earnings.',
      highlight: formatInr(vendorSharePaise),
    };
  }

  return {
    title: 'Delivery complete',
    body: 'Your balance will update shortly. Check Wallet for earnings and activity.',
    highlight: null,
  };
}

export function JobCompletedSuccessSheet({
  open,
  onClose,
  paymentMethod,
  collectionMethod,
  vendorSharePaise,
}: JobCompletedSuccessSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetBottomPadding = Math.max(insets.bottom, 16);
  const copy = successCopy(paymentMethod, collectionMethod, vendorSharePaise);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 justify-end">
          <Pressable className="absolute inset-0 bg-black/45" onPress={onClose} />
          <View
            className="rounded-t-3xl bg-background px-5 pt-6"
            style={{ paddingBottom: sheetBottomPadding }}>
            <View className="items-center gap-3">
              <IconWell
                icon={CheckCircle2}
                size="lg"
                className="bg-emerald-500/15"
                iconClassName="text-emerald-600"
              />
              <Text className="text-foreground text-center text-xl font-semibold">{copy.title}</Text>
              {copy.highlight ? (
                <Text className="text-center text-3xl font-bold text-emerald-600">{copy.highlight}</Text>
              ) : null}
              <Text className="text-muted-foreground text-center text-sm leading-5">{copy.body}</Text>
            </View>

            <View className="mt-5 flex-row items-start gap-2.5 rounded-2xl border border-border/60 bg-muted/30 px-3.5 py-3.5">
              <IconWell icon={Wallet} size="sm" className="mt-0.5 bg-background" />
              <Text className="text-muted-foreground flex-1 text-sm leading-5">
                Earnings from online payments show in{' '}
                <Text className="font-medium text-foreground">Available balance</Text>. Cash bookings
                show under <Text className="font-medium text-foreground">COD dues</Text>.
              </Text>
            </View>

            <Button className="mt-5 h-12 rounded-full" onPress={onClose}>
              <Text className="font-semibold">Done</Text>
            </Button>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
