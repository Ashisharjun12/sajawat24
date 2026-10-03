import { resolvePincode } from '@/api/geo.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { getApiError } from '@/api/client';
import { useLocationStore, type ServiceCity } from '@/store/location.store';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

type HomeLocationSheetProps = {
  onClose: () => void;
};

export function HomeLocationSheet({ onClose }: HomeLocationSheetProps) {
  const cities = useLocationStore((s) => s.cities);
  const city = useLocationStore((s) => s.city);
  const setLocation = useLocationStore((s) => s.setLocation);
  const [pincodeInput, setPincodeInput] = useState('');
  const [error, setError] = useState('');
  const [resolving, setResolving] = useState(false);

  async function selectCity(next: ServiceCity) {
    setError('');
    await setLocation({ city: next, pincode: null, source: 'manual' });
    onClose();
  }

  async function applyPincode() {
    const code = pincodeInput.trim();
    if (!code || code.length < 6 || !city) {
      setError('Enter a 6-digit pincode');
      return;
    }
    setResolving(true);
    setError('');
    try {
      const data = (await resolvePincode(code, { cityId: city.id })) as {
        deliverable?: boolean;
        city?: ServiceCity;
      };
      if (!data?.deliverable || !data.city?.id) {
        setError('We do not deliver to this pincode yet');
        return;
      }
      await setLocation({
        city: data.city,
        pincode: { code },
        source: 'pincode',
      });
      onClose();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setResolving(false);
    }
  }

  return (
    <ScrollView className="max-h-[70%]" keyboardShouldPersistTaps="handled">
      <View className="gap-4 p-4">
        <Text className="text-foreground text-lg font-semibold">Choose city</Text>
        <Text className="text-muted-foreground text-sm">
          Home offers and availability depend on your city and pincode.
        </Text>
        {cities.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => void selectCity(item)}
            className="border-border rounded-xl border px-4 py-3"
            accessibilityRole="button">
            <Text className="text-foreground font-medium">{item.name}</Text>
            {city?.id === item.id ? (
              <Text className="text-primary text-xs font-semibold">Selected</Text>
            ) : null}
          </Pressable>
        ))}
        {city ? (
          <View className="gap-2 border-t border-border/70 pt-4">
            <Text className="text-foreground text-sm font-semibold">Pincode in {city.name}</Text>
            <Input
              value={pincodeInput}
              onChangeText={setPincodeInput}
              placeholder="6-digit pincode"
              keyboardType="number-pad"
              maxLength={6}
              className="h-11"
            />
            {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
            <Button onPress={() => void applyPincode()} disabled={resolving}>
              <Text>{resolving ? 'Checking…' : 'Apply pincode'}</Text>
            </Button>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
