import { Screen } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { PayoutSubscreenHeader } from '@/module/payouts/components/PayoutSubscreenHeader';
import { UpiIdRow } from '@/module/payouts/components/UpiIdRow';
import { usePayoutMethods } from '@/module/payouts/hooks/use-payout-methods';
import { router } from 'expo-router';
import { LoadingPlaceholder } from '@/components/shell';
import { View } from 'react-native';

function ListDivider() {
  return <View className="h-px bg-border/40" />;
}

export default function UpiIdsScreen() {
  const { data: methods, isLoading } = usePayoutMethods();
  const upiIds = (methods ?? []).filter((m) => m.type === 'upi');

  return (
    <Screen>
      <View className="gap-5">
        <PayoutSubscreenHeader
          title="UPI IDs"
          subtitle="Add a UPI ID for faster withdrawals."
          backHref="/(app)/payouts"
        />

        {isLoading ? (
          <LoadingPlaceholder />
        ) : upiIds.length === 0 ? (
          <View className="gap-3 rounded-3xl bg-muted/50 px-5 py-8">
            <Text className="text-foreground text-center text-base font-medium">No UPI IDs yet</Text>
            <Text className="text-muted-foreground text-center text-sm leading-5">
              Link your UPI ID to withdraw earnings to your preferred app.
            </Text>
          </View>
        ) : (
          <View className="px-1">
            {upiIds.map((upi, index) => (
              <View key={upi.id}>
                <UpiIdRow upi={upi} />
                {index < upiIds.length - 1 ? <ListDivider /> : null}
              </View>
            ))}
          </View>
        )}

        <Button className="h-12 rounded-full" onPress={() => router.push('/(app)/add-upi-id')}>
          <Text>Add UPI ID</Text>
        </Button>
      </View>
    </Screen>
  );
}
