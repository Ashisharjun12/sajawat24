import { FadeInView, PressableScale } from '@/components/motion';
import { Screen, Surface } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { WalletSummary } from '@/api/wallet.api';
import { formatInr } from '@/module/bookings/lib/booking-format';
import { formatUnreadBadgeCount } from '@/module/notifications/lib/notification-format';
import { useUnreadNotificationCount } from '@/module/notifications/hooks/use-unread-count';
import { WalletActivitySection } from '@/module/payouts/components/WalletActivitySection';
import { WalletBalanceCard } from '@/module/payouts/components/WalletBalanceCard';
import { WalletSummarySkeleton } from '@/module/payouts/components/WalletSummarySkeleton';
import { WalletPaymentMethodsSection } from '@/module/payouts/components/WalletPaymentMethodsSection';
import { WithdrawMoneySheet } from '@/module/payouts/components/WithdrawMoneySheet';
import { usePayoutMethods, payoutMethodKeys } from '@/module/payouts/hooks/use-payout-methods';
import { resolveDefaultPayoutMethod } from '@/module/payouts/lib/payout-method-format';
import { useWalletSummary, useWalletWithdraw, walletKeys } from '@/module/payouts/hooks/use-wallet';
import { useScreenRefresh } from '@/hooks/use-screen-refresh';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import type { PayoutSummary } from '@/module/payouts/lib/payout.types';
import { router } from 'expo-router';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { View } from 'react-native';

function mapSummary(api: WalletSummary): PayoutSummary {
  let withdrawDisabledReason: string | null = null;
  if (api.hasActiveWithdrawal) {
    withdrawDisabledReason = 'A withdrawal is already in progress';
  } else if (!api.hasPayoutMethod) {
    withdrawDisabledReason = 'Add a bank account or UPI ID to withdraw';
  } else if (api.availablePaise <= 0) {
    withdrawDisabledReason = 'No available balance to withdraw';
  } else if (api.availablePaise < api.minWithdrawalPaise) {
    withdrawDisabledReason = `Minimum withdrawal is ${formatInr(api.minWithdrawalPaise)}`;
  } else if (!api.assignable && api.autoNetCodFromEarnings && api.codDuesPaise > api.codMaxDuePaise) {
    withdrawDisabledReason = 'Clear COD dues above the cap to withdraw';
  }

  return {
    available: api.availablePaise,
    pending: api.pendingPaise,
    earnedThisMonth: api.earnedThisMonthPaise,
    codDues: api.codDuesPaise,
    codCapWarning: !api.assignable,
    minWithdrawalPaise: api.minWithdrawalPaise,
    canWithdraw: withdrawDisabledReason == null,
    withdrawDisabledReason,
  };
}

export default function WalletScreen() {
  const queryClient = useQueryClient();
  const { data: wallet, isLoading } = useWalletSummary();

  const refetchWallet = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: walletKeys.all }),
      queryClient.invalidateQueries({ queryKey: payoutMethodKeys.all }),
    ]);
  }, [queryClient]);

  const { refreshControl } = useScreenRefresh(refetchWallet);
  const { data: payoutMethods } = usePayoutMethods();
  const withdrawMutation = useWalletWithdraw();
  const unreadCount = useUnreadNotificationCount();
  const badgeLabel = formatUnreadBadgeCount(unreadCount);
  const canGoBack = router.canGoBack();

  const summary = wallet ? mapSummary(wallet) : null;
  const payoutMethodList = payoutMethods ?? [];
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState('');

  useEffect(() => {
    const methods = payoutMethods ?? [];
    if (methods.length === 0) {
      setSelectedMethodId('');
      return;
    }
    const stillValid = methods.some((method) => method.id === selectedMethodId);
    if (!stillValid) {
      const defaultMethod = resolveDefaultPayoutMethod(methods);
      if (defaultMethod) setSelectedMethodId(defaultMethod.id);
    }
  }, [payoutMethods, selectedMethodId]);

  function onWithdrawPress() {
    if (!summary || !summary.canWithdraw || !wallet || payoutMethodList.length === 0) return;
    const defaultMethod = resolveDefaultPayoutMethod(payoutMethodList);
    if (defaultMethod) setSelectedMethodId(defaultMethod.id);
    setWithdrawOpen(true);
  }

  async function onConfirmWithdraw() {
    if (!wallet || !selectedMethodId) return;
    await withdrawMutation.mutateAsync({
      amountPaise: wallet.availablePaise,
      payoutMethodId: selectedMethodId,
    });
  }

  return (
    <Screen scrollProps={{ refreshControl }}>
      <View className="gap-1 px-1">
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            {canGoBack ? (
              <PressableScale
                onPress={() => router.back()}
                className="-ml-1"
                accessibilityLabel="Go back"
                scaleTo={0.92}>
                <View className="size-10 items-center justify-center">
                  <Icon as={ArrowLeft} className="text-foreground size-5" />
                </View>
              </PressableScale>
            ) : null}
            <Text className="text-foreground text-2xl font-semibold">Wallet</Text>
          </View>

          <PressableScale
            className="relative size-11 items-center justify-center rounded-full bg-muted"
            onPress={() => router.push('/(app)/notifications')}
            accessibilityLabel="Notifications"
            scaleTo={0.92}>
            <Icon as={Bell} className="text-foreground size-5" />
            {badgeLabel ? (
              <View className="absolute -right-0.5 -top-0.5 min-w-[22px] items-center justify-center rounded-full bg-primary px-1 py-0.5">
                <Text className="text-[10px] font-semibold text-primary-foreground">
                  {badgeLabel}
                </Text>
              </View>
            ) : null}
          </PressableScale>
        </View>

        <Text className="text-muted-foreground text-sm">Earnings and payouts</Text>
      </View>

      {isLoading || !summary ? (
        <WalletSummarySkeleton />
      ) : (
        <>
          <FadeInView>
            <WalletBalanceCard summary={summary} />
          </FadeInView>

          {summary.available === 0 && summary.codDues > 0 ? (
            <FadeInView delay={40}>
              <Surface className="bg-muted/50 p-4 shadow-none">
                <Text className="text-muted-foreground text-sm leading-5">
                  Cash COD jobs add commission to{' '}
                  <Text className="font-medium text-foreground">COD dues</Text>, not available
                  balance. Check the COD tab under Activity.
                </Text>
              </Surface>
            </FadeInView>
          ) : null}

          {summary.codCapWarning ? (
            <FadeInView delay={60}>
              <Surface className="bg-amber-500/10 p-4 shadow-none">
                <Text className="text-foreground text-sm font-medium">COD dues outstanding</Text>
                <Text className="text-muted-foreground mt-1 text-sm">
                  You owe {formatInr(summary.codDues)} from cash bookings. Clear dues to keep
                  receiving new assignments.
                </Text>
              </Surface>
            </FadeInView>
          ) : null}

          <FadeInView delay={80}>
            <Button
              variant="success"
              className="h-12 rounded-full"
              disabled={!summary.canWithdraw || withdrawMutation.isPending}
              onPress={onWithdrawPress}>
              <Text className="text-base font-semibold text-white">
                {withdrawMutation.isPending ? 'Processing…' : 'Withdraw money'}
              </Text>
            </Button>
            {summary.withdrawDisabledReason ? (
              <Text className="text-muted-foreground mt-2 text-center text-xs">
                {summary.withdrawDisabledReason}
              </Text>
            ) : null}
          </FadeInView>
        </>
      )}

      <FadeInView delay={100}>
        <WalletPaymentMethodsSection
          onPressBank={() => router.push('/(app)/bank-accounts')}
          onPressUpi={() => router.push('/(app)/upi-ids')}
        />
      </FadeInView>

      <FadeInView delay={120}>
        <WalletActivitySection />
      </FadeInView>

      {wallet && payoutMethodList.length > 0 && summary ? (
        <WithdrawMoneySheet
          open={withdrawOpen}
          onClose={() => setWithdrawOpen(false)}
          amountPaise={wallet.availablePaise}
          payoutMethods={payoutMethodList}
          selectedMethodId={selectedMethodId}
          onSelectMethodId={setSelectedMethodId}
          onConfirm={onConfirmWithdraw}
        />
      ) : null}
    </Screen>
  );
}
