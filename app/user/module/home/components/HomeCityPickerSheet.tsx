import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { cn } from '@/lib/utils';
import { HomeCityMapIcon } from '@/module/home/components/HomeCityMapIcon';
import { useLocationStore, type ServiceCity } from '@/store/location.store';
import { Search } from 'lucide-react-native';
import { useKeyboardInset } from '@/lib/use-keyboard-inset';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, useWindowDimensions, View } from 'react-native';

type HomeCityPickerSheetProps = {
  onClose: () => void;
  currentLabel?: string;
};

function CityRadio({ selected }: { selected: boolean }) {
  return (
    <View
      className={cn(
        'size-5 items-center justify-center rounded-full border-2',
        selected ? 'border-primary' : 'border-muted-foreground/35',
      )}>
      {selected ? <View className="size-2.5 rounded-full bg-primary" /> : null}
    </View>
  );
}

function CityRow({
  item,
  selected,
  onSelect,
}: {
  item: ServiceCity;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}>
      <View className="flex-row items-center gap-3 border-b border-border/80 py-3.5">
        <HomeCityMapIcon variant="listRow" />
        <Text className="text-foreground min-w-0 flex-1 text-base">{item.name}</Text>
        <CityRadio selected={selected} />
      </View>
    </Pressable>
  );
}

const SHEET_SEARCH_CHROME = 120;

export function HomeCityPickerSheet({ onClose, currentLabel }: HomeCityPickerSheetProps) {
  const keyboardInset = useKeyboardInset(true);
  const { height: windowHeight } = useWindowDimensions();
  const listMaxHeight = useMemo(() => {
    const expanded = Math.round(windowHeight * 0.52);
    if (keyboardInset <= 0) return expanded;
    const aboveKeyboard = windowHeight - keyboardInset - SHEET_SEARCH_CHROME - 96;
    return Math.max(140, Math.min(expanded, aboveKeyboard));
  }, [windowHeight, keyboardInset]);
  const cities = useLocationStore((s) => s.cities);
  const city = useLocationStore((s) => s.city);
  const setLocation = useLocationStore((s) => s.setLocation);
  const fetchCities = useLocationStore((s) => s.fetchCities);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    void fetchCities()
      .then(() => {
        if (cancelled) return;
        const count = useLocationStore.getState().cities.length;
        setLoadError(count === 0);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchCities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.name.toLowerCase().includes(q));
  }, [cities, query]);

  async function selectCity(next: ServiceCity) {
    await setLocation({ city: next, pincode: null, source: 'manual' });
    onClose();
  }

  return (
    <View className="px-4 pb-2 pt-3">
      <Text className="text-foreground mb-1 text-center text-lg font-semibold">Choose city</Text>
      {currentLabel && currentLabel !== 'Select city' ? (
        <Text className="text-muted-foreground mb-3 text-center text-xs">
          Current: {currentLabel}
        </Text>
      ) : (
        <Text className="text-muted-foreground mb-3 text-center text-xs">
          Pick a city to see packages and pricing
        </Text>
      )}
      <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-border bg-background px-3">
        <Icon as={Search} className="text-muted-foreground size-5 shrink-0" />
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search city"
          className="h-11 flex-1 border-0 bg-transparent px-0 shadow-none"
          autoCorrect={false}
          autoCapitalize="words"
          clearButtonMode="while-editing"
        />
      </View>
      {loading ? (
        <View className="items-center py-8">
          <ActivityIndicator />
          <Text className="text-muted-foreground mt-2 text-sm">Loading cities…</Text>
        </View>
      ) : loadError ? (
        <View className="items-center gap-3 py-6">
          <Text className="text-muted-foreground text-center text-sm">
            Could not load cities. Check your connection and API URL.
          </Text>
          <ScalePressable
            onPress={() => {
              setLoading(true);
              setLoadError(false);
              void fetchCities().finally(() => {
                setLoading(false);
                setLoadError(useLocationStore.getState().cities.length === 0);
              });
            }}
            haptic
            className="rounded-full bg-primary px-4 py-2">
            <Text className="text-primary-foreground text-sm font-semibold">Retry</Text>
          </ScalePressable>
        </View>
      ) : filtered.length === 0 ? (
        <Text className="text-muted-foreground py-6 text-center text-sm">
          No city matches your search
        </Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator
          style={{ maxHeight: listMaxHeight }}
          renderItem={({ item }) => (
            <CityRow
              item={item}
              selected={city?.id === item.id}
              onSelect={() => void selectCity(item)}
            />
          )}
        />
      )}
    </View>
  );
}
