import { autocompletePlaces, getPlaceDetails } from '@/api/maps.api';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

function randomSessionToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onPlaceSelected: (details: {
    address: string;
    pincode: string | null;
    latitude: number;
    longitude: number;
  }) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
};

export function ShopPlacesAutocomplete({
  value,
  onChangeText,
  onPlaceSelected,
  disabled,
  error,
  placeholder = 'Search area, street name…',
}: Props) {
  const [predictions, setPredictions] = useState<Array<{ placeId: string; description: string }>>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const sessionRef = useRef(randomSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPredictions = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (trimmed.length < 3) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const items = await autocompletePlaces(trimmed, sessionRef.current);
      setPredictions(items);
      setOpen(items.length > 0);
    } catch {
      setPredictions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchPredictions(value);
    }, 320);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchPredictions]);

  async function handleSelect(placeId: string, description: string) {
    setOpen(false);
    setPredictions([]);
    onChangeText(description);
    try {
      const details = await getPlaceDetails(placeId, sessionRef.current);
      sessionRef.current = randomSessionToken();
      onPlaceSelected({
        address: details.formattedAddress || description,
        pincode: details.pincode,
        latitude: details.latitude,
        longitude: details.longitude,
      });
    } catch {
      // keep typed address
    }
  }

  function handleChangeText(text: string) {
    onChangeText(text);
    if (text.trim().length >= 3) {
      setOpen(true);
    }
  }

  return (
    <View className="relative z-10">
      <View
        className="h-12 flex-row items-center gap-2 rounded-xl border border-border bg-card px-3">
        <Icon as={Search} className="text-muted-foreground size-[18px] shrink-0" />
        <Input
          value={value}
          onChangeText={handleChangeText}
          editable={!disabled}
          placeholder={placeholder}
          accessibilityLabel="Search shop address"
          className="h-11 flex-1 border-0 bg-transparent px-0 shadow-none"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="words"
        />
        {value.length > 0 ? (
          <Pressable
            onPress={() => {
              onChangeText('');
              setPredictions([]);
              setOpen(false);
            }}
            hitSlop={8}
            accessibilityLabel="Clear search">
            <Icon as={X} className="text-muted-foreground size-4" />
          </Pressable>
        ) : null}
      </View>
      {loading ? (
        <Text className="mt-2 text-xs text-muted-foreground">Searching…</Text>
      ) : null}
      {error ? <Text className="mt-2 text-sm text-destructive">{error}</Text> : null}
      {open && predictions.length > 0 ? (
        <View className="mt-2 max-h-56 overflow-hidden rounded-xl border border-border bg-card">
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {predictions.map((item) => (
              <Pressable
                key={item.placeId}
                onPress={() => void handleSelect(item.placeId, item.description)}
                className="border-b border-border/60 px-4 py-3 active:bg-muted">
                <Text className="text-sm leading-5 text-foreground">{item.description}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
