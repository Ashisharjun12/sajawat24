import { Screen } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { BankAccountRow } from '@/module/payouts/components/BankAccountRow';
import { PayoutSubscreenHeader } from '@/module/payouts/components/PayoutSubscreenHeader';
import { usePayoutMethods } from '@/module/payouts/hooks/use-payout-methods';
import { router } from 'expo-router';
import { LoadingPlaceholder } from '@/components/shell';
import { View } from 'react-native';

function ListDivider() {
  return <View className="h-px bg-border/40" />;
}

export default function BankAccountsScreen() {
  const { data: methods, isLoading } = usePayoutMethods();
  const bankAccounts = (methods ?? []).filter((m) => m.type === 'bank');

  return (
    <Screen>
      <View className="gap-5">
        <PayoutSubscreenHeader
          title="Bank accounts"
          subtitle="Add a bank account to receive withdrawals."
          backHref="/(app)/payouts"
        />

        {isLoading ? (
          <LoadingPlaceholder />
        ) : bankAccounts.length === 0 ? (
          <View className="gap-3 rounded-3xl bg-muted/50 px-5 py-8">
            <Text className="text-foreground text-center text-base font-medium">
              No bank accounts yet
            </Text>
            <Text className="text-muted-foreground text-center text-sm leading-5">
              Link your bank account to withdraw earnings from your wallet.
            </Text>
          </View>
        ) : (
          <View className="px-1">
            {bankAccounts.map((account, index) => (
              <View key={account.id}>
                <BankAccountRow account={account} />
                {index < bankAccounts.length - 1 ? <ListDivider /> : null}
              </View>
            ))}
          </View>
        )}

        <Button
          className="h-12 rounded-full"
          onPress={() => router.push('/(app)/add-bank-account')}>
          <Text>Add bank account</Text>
        </Button>
      </View>
    </Screen>
  );
}
