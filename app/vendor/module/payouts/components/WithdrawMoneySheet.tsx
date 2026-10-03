import type { PayoutMethod } from '@/api/payout-methods.api';
import { IconWell } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatInr } from '@/module/bookings/lib/booking-format';
import { WithdrawPayoutMethodPicker } from '@/module/payouts/components/WithdrawPayoutMethodPicker';
import { CheckCircle2, Clock3 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { AppSpinner } from '@/components/ui/app-spinner';
import { Modal, Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type WithdrawMoneySheetProps = {
  open: boolean;
  onClose: () => void;
  amountPaise: number;
  payoutMethods: PayoutMethod[];
  selectedMethodId: string;
  onSelectMethodId: (id: string) => void;
  onConfirm: () => Promise<void>;
};

export function WithdrawMoneySheet({
  open,
  onClose,
  amountPaise,
  payoutMethods,
  selectedMethodId,
  onSelectMethodId,
  onConfirm,
}: WithdrawMoneySheetProps) {
  const insets = useSafeAreaInsets();
  const sheetBottomPadding = Math.max(insets.bottom, 16);
  const [phase, setPhase] = useState<'confirm' | 'success'>('confirm');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase('confirm');
      setLoading(false);
      setError(null);
    }
  }, [open]);

  async function handleConfirm() {
    if (!selectedMethodId) return;
    setError(null);
    setLoading(true);
    try {
      await onConfirm();
      setPhase('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not request withdrawal. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 justify-end">
          <Pressable className="absolute inset-0 bg-black/45" onPress={loading ? undefined : onClose} />
          <View
            className="rounded-t-3xl bg-background px-5 pt-6"
            style={{ paddingBottom: sheetBottomPadding }}>
            {phase === 'confirm' ? (
              <>
                <View className="items-center gap-2">
                  <Text className="text-foreground text-center text-xl font-semibold">
                    Request payout
                  </Text>
                  <Text className="text-muted-foreground text-center text-sm leading-5">
                    Choose where to send your earnings. Our team will transfer manually after review.
                  </Text>
                </View>

                <View className="mt-5 gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="text-muted-foreground text-sm">Amount</Text>
                    <Text className="text-foreground text-lg font-bold">{formatInr(amountPaise)}</Text>
                  </View>
                </View>

                <View className="mt-4">
                  <WithdrawPayoutMethodPicker
                    methods={payoutMethods}
                    selectedMethodId={selectedMethodId}
                    onSelectMethodId={onSelectMethodId}
                  />
                </View>

                <View className="mt-4 flex-row items-start gap-2.5 rounded-2xl bg-muted/40 px-3.5 py-3">
                  <IconWell icon={Clock3} size="sm" className="mt-0.5 bg-background" />
                  <Text className="text-muted-foreground flex-1 text-sm leading-5">
                    Payouts are usually credited within{' '}
                    <Text className="font-medium text-foreground">2 business days</Text> after
                    approval.
                  </Text>
                </View>

                {error ? <Text className="mt-3 text-center text-sm text-destructive">{error}</Text> : null}

                <View className="mt-5 gap-3">
                  <Button
                    className="h-12 rounded-full"
                    variant="success"
                    disabled={loading || !selectedMethodId}
                    onPress={() => void handleConfirm()}>
                    {loading ? (
                      <AppSpinner size="sm" variant="inverse" />
                    ) : (
                      <Text className="text-base font-semibold text-white">Confirm withdrawal</Text>
                    )}
                  </Button>
                  <Button className="h-11 rounded-full" variant="ghost" disabled={loading} onPress={onClose}>
                    <Text className="font-medium">Not now</Text>
                  </Button>
                </View>
              </>
            ) : (
              <>
                <View className="items-center gap-3">
                  <IconWell
                    icon={CheckCircle2}
                    size="lg"
                    className="bg-emerald-500/15"
                    iconClassName="text-emerald-600"
                  />
                  <Text className="text-foreground text-center text-xl font-semibold">
                    Payout requested
                  </Text>
                  <Text className="text-muted-foreground text-center text-sm leading-5">
                    We&apos;ve received your request for {formatInr(amountPaise)}. You&apos;ll see the
                    status update in your wallet activity.
                  </Text>
                </View>

                <View className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4">
                  <Text className="text-foreground text-sm font-medium">What happens next</Text>
                  <Text className="text-muted-foreground mt-1.5 text-sm leading-5">
                    Our finance team processes withdrawals manually. Expect funds in your account
                    within 2 business days.
                  </Text>
                </View>

                <Button className="mt-5 h-12 rounded-full" onPress={onClose}>
                  <Text className="font-semibold">Done</Text>
                </Button>
              </>
            )}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
