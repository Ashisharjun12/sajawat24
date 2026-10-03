import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { isValidIfsc, normalizeIfsc } from '@/module/payouts/lib/payout-method-format';
import { useAddBankPayoutMethod } from '@/module/payouts/hooks/use-payout-methods';
import { type Href, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

export function AddBankAccountForm() {
  const addBank = useAddBankPayoutMethod();

  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const normalizedAccountNumber = accountNumber.replace(/\D/g, '');
  const normalizedConfirm = confirmAccountNumber.replace(/\D/g, '');
  const normalizedIfsc = normalizeIfsc(ifscCode);

  const canSave = useMemo(() => {
    return (
      accountHolderName.trim().length >= 2 &&
      bankName.trim().length >= 2 &&
      normalizedAccountNumber.length >= 9 &&
      normalizedAccountNumber === normalizedConfirm &&
      isValidIfsc(normalizedIfsc)
    );
  }, [
    accountHolderName,
    bankName,
    normalizedAccountNumber,
    normalizedConfirm,
    normalizedIfsc,
  ]);

  function handleSave() {
    if (!canSave) return;

    void addBank
      .mutateAsync({
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
        accountNumber: normalizedAccountNumber,
        ifsc: normalizedIfsc,
      })
      .then(() => {
        Alert.alert('Bank account added', 'Your bank account has been saved.');
        router.replace('/(app)/bank-accounts' as Href);
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
        <Label nativeID="bank-name">Bank name</Label>
        <Input
          nativeID="bank-name"
          value={bankName}
          onChangeText={setBankName}
          placeholder="e.g. HDFC Bank"
          autoCapitalize="words"
        />
      </View>

      <View className="gap-2">
        <Label nativeID="account-number">Account number</Label>
        <Input
          nativeID="account-number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder="Enter account number"
          keyboardType="number-pad"
        />
      </View>

      <View className="gap-2">
        <Label nativeID="confirm-account-number">Confirm account number</Label>
        <Input
          nativeID="confirm-account-number"
          value={confirmAccountNumber}
          onChangeText={setConfirmAccountNumber}
          placeholder="Re-enter account number"
          keyboardType="number-pad"
        />
        {normalizedConfirm.length > 0 && normalizedAccountNumber !== normalizedConfirm ? (
          <Text className="text-destructive text-xs">Account numbers do not match.</Text>
        ) : null}
      </View>

      <View className="gap-2">
        <Label nativeID="ifsc-code">IFSC code</Label>
        <Input
          nativeID="ifsc-code"
          value={ifscCode}
          onChangeText={(value) => setIfscCode(normalizeIfsc(value))}
          placeholder="e.g. HDFC0001234"
          autoCapitalize="characters"
          maxLength={11}
        />
        {ifscCode.length > 0 && !isValidIfsc(normalizedIfsc) ? (
          <Text className="text-destructive text-xs">Enter a valid 11-character IFSC code.</Text>
        ) : null}
      </View>

      <Button
        className="mt-2 h-12 rounded-full"
        disabled={!canSave || addBank.isPending}
        onPress={handleSave}>
        <Text>{addBank.isPending ? 'Saving…' : 'Save bank account'}</Text>
      </Button>
    </View>
  );
}
