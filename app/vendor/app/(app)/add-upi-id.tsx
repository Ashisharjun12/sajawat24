import { Screen } from '@/components/shell';
import { AddUpiIdForm } from '@/module/payouts/components/AddUpiIdForm';
import { PayoutSubscreenHeader } from '@/module/payouts/components/PayoutSubscreenHeader';
import { View } from 'react-native';

export default function AddUpiIdScreen() {
  return (
    <Screen>
      <View className="gap-5">
        <PayoutSubscreenHeader
          title="Add UPI ID"
          subtitle="Enter the UPI ID you want to use for withdrawals."
          backHref="/(app)/upi-ids"
        />
        <AddUpiIdForm />
      </View>
    </Screen>
  );
}
