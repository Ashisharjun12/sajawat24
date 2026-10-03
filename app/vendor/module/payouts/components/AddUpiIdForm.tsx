import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { isValidUpiVpa } from '@/module/payouts/lib/payout-method-format';
import { useAddUpiPayoutMethod } from '@/module/payouts/hooks/use-payout-methods';
import { type Href, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

export function AddUpiIdForm() {
  const addUpi = useAddUpiPayoutMethod();
  const [accountHolderName, setAccountHolderName] = useState('');
  const [vpa, setVpa] = useState('');

  const trimmedVpa = vpa.trim().toLowerCase();
  const canSave = useMemo(
    () => accountHolderName.trim().length >= 2 && isValidUpiVpa(trimmedVpa),
    [accountHolderName, trimmedVpa],
  );

  function handleSave() {
    if (!canSave) return;

    void addUpi
      .mutateAsync({
        accountHolderName: accountHolderName.trim(),
        upiId: trimmedVpa,
      })
      .then(() => {
        Alert.alert('UPI ID added', 'Your UPI ID has been saved.');
        router.replace('/(app)/upi-ids' as Href);
      })
      .catch((err: unknown) => {
        Alert.alert('Could not save', err instanceof Error ? err.message : 'Try again.');
      });
  }

  return (
    <View className="gap-5 px-1">
      <View className="gap-2">
        <Label nativeID="account-holder-name">Account holder name</Label>
        <Input
          nativeID="account-holder-name"
          value={accountHolderName}
          onChangeText={setAccountHolderName}
          placeholder="As per bank records"
          autoCapitalize="words"
        />
      </View>

      <View className="gap-2">
        <Label nativeID="upi-id">UPI ID</Label>
        <Input
          nativeID="upi-id"
          value={vpa}
          onChangeText={setVpa}
          placeholder="yourname@upi"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        {vpa.length > 0 && !isValidUpiVpa(trimmedVpa) ? (
          <Text className="text-destructive text-xs">Enter a valid UPI ID, e.g. name@okaxis</Text>
        ) : null}
        <Text className="text-muted-foreground text-xs">
          Use the UPI ID linked to your bank account for withdrawals.
        </Text>
      </View>

      <Button
        className="mt-2 h-12 rounded-full"
        disabled={!canSave || addUpi.isPending}
        onPress={handleSave}>
        <Text>{addUpi.isPending ? 'Saving…' : 'Save UPI ID'}</Text>
      </Button>
    </View>
  );
}
