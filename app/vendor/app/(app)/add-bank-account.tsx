import { Screen } from '@/components/shell';
import { AddBankAccountForm } from '@/module/payouts/components/AddBankAccountForm';
import { PayoutSubscreenHeader } from '@/module/payouts/components/PayoutSubscreenHeader';
import { View } from 'react-native';

export default function AddBankAccountScreen() {
  return (
    <Screen>
      <View className="gap-5">
        <PayoutSubscreenHeader
          title="Add bank account"
          subtitle="Enter your bank details carefully. Demo only for now."
          backHref="/(app)/bank-accounts"
        />
        <AddBankAccountForm />
      </View>
    </Screen>
  );
}
