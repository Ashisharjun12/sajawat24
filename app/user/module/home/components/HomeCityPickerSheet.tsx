import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { cn } from '@/lib/utils';
import { useLocationStore, type ServiceCity } from '@/store/location.store';
import { MapPin, Search } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

const POPULAR_CITY_COUNT = 6;

type HomeCityPickerSheetProps = {
  onClose: () => void;
  currentLabel?: string;
};

function sortCitiesByName(list: ServiceCity[]) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-micro mb-2.5 px-0.5 font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </Text>
  );
}

function LocationPickerHeader() {
  return (
    <View className="flex-row items-start gap-2.5 px-4 pb-1.5 pt-0.5">
      <View
        className="size-10 shrink-0 items-center justify-center rounded-full bg-primary-tint"
        accessibilityElementsHidden>
        <Icon as={MapPin} className="size-4 text-primary" strokeWidth={2.25} />
      </View>
      <View className="min-w-0 flex-1 pt-0.5">
        <Text className="text-foreground text-body font-semibold tracking-tight">
          Select your city
        </Text>
        <Text className="text-muted-foreground mt-0.5 text-caption">See pricing for your location</Text>
      </View>
    </View>
  );
}

function PopularCityCard({
  city,
  selected,
  onSelect,
}: {
  city: ServiceCity;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        'min-h-[76px] w-full flex-col items-center gap-1.5 rounded-card border border-border/80 bg-card px-1 py-2.5',
        selected && 'border-primary/50 bg-primary-tint',
      )}>
      <View className="size-8 items-center justify-center rounded-full bg-primary-tint">
        <Icon as={MapPin} className="size-3.5 text-primary" strokeWidth={2.25} />
      </View>
      <Text
        className="text-foreground min-h-[2.25em] w-full text-center text-[11px] font-semibold leading-tight"
        numberOfLines={2}>
        {city.name}
      </Text>
    </Pressable>
  );
}

function AllCityRow({
  city,
  selected,
  onSelect,
}: {
  city: ServiceCity;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        'flex-row items-center gap-2.5 rounded-btn px-3 py-2.5',
        selected ? 'bg-primary-tint' : 'active:bg-muted/80',
      )}>
      <Icon
        as={MapPin}
        className={cn('size-4 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')}
        strokeWidth={2.25}
      />
      <Text className="text-foreground min-w-0 flex-1 text-sm font-medium" numberOfLines={1}>
        {city.name}
      </Text>
    </Pressable>
  );
}

export function HomeCityPickerSheet({ onClose }: HomeCityPickerSheetProps) {
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
        setLoadError(useLocationStore.getState().cities.length === 0);
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

  const isSearching = query.trim().length > 0;

  const popularCities = useMemo(() => {
    if (isSearching || cities.length === 0) return [];
    return cities.slice(0, POPULAR_CITY_COUNT);
  }, [cities, isSearching]);

  const popularRows = useMemo(() => {
    const rows: ServiceCity[][] = [];
    for (let i = 0; i < popularCities.length; i += 3) {
      rows.push(popularCities.slice(i, i + 3));
    }
    return rows;
  }, [popularCities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortCitiesByName(cities);
    return sortCitiesByName(cities.filter((item) => item.name.toLowerCase().includes(q)));
  }, [cities, query]);

  async function selectCity(next: ServiceCity) {
    await setLocation({ city: next, pincode: null, source: 'manual' });
    onClose();
  }

  return (
    <View className="min-h-0 flex-1">
      <LocationPickerHeader />

      <View className="px-4 pb-2.5">
        <View className="relative flex-row items-center rounded-input border-2 border-primary/35 bg-muted/30 px-3">
          <Icon as={Search} className="text-muted-foreground size-4 shrink-0" />
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Search city…"
            className="h-10 flex-1 border-0 bg-transparent px-2 shadow-none"
            autoCorrect={false}
            autoCapitalize="words"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator />
          <Text className="text-muted-foreground mt-2 text-sm">Loading cities…</Text>
        </View>
      ) : loadError ? (
        <View className="items-center gap-3 px-4 py-8">
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
            className="h-10 justify-center rounded-btn bg-primary px-5">
            <Text className="text-primary-foreground text-button font-semibold">Retry</Text>
          </ScalePressable>
        </View>
      ) : cities.length === 0 ? (
        <Text className="text-muted-foreground py-10 text-center text-sm">
          No cities available yet.
        </Text>
      ) : (
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator
          contentContainerClassName="grow px-4 pb-4">
          {filtered.length === 0 ? (
            <Text className="text-muted-foreground py-10 text-center text-sm">
              No city matches that search.
            </Text>
          ) : null}

          {popularCities.length > 0 ? (
            <View className="mb-4" accessibilityLabel="Popular cities">
              <SectionLabel>Popular cities</SectionLabel>
              <View className="gap-2">
                {popularRows.map((row) => (
                  <View key={row.map((c) => c.id).join('-')} className="flex-row gap-2">
                    {row.map((item) => (
                      <View key={item.id} className="min-w-0 flex-1">
                        <PopularCityCard
                          city={item}
                          selected={city?.id === item.id}
                          onSelect={() => void selectCity(item)}
                        />
                      </View>
                    ))}
                    {row.length < 3
                      ? Array.from({ length: 3 - row.length }).map((_, i) => (
                          <View key={`pad-${i}`} className="min-w-0 flex-1" />
                        ))
                      : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {filtered.length > 0 ? (
            <View accessibilityLabel={isSearching ? 'Search results' : 'All cities'}>
              <SectionLabel>{isSearching ? 'Results' : 'All cities'}</SectionLabel>
              <View className="gap-0.5">
                {filtered.map((item) => (
                  <AllCityRow
                    key={item.id}
                    city={item}
                    selected={city?.id === item.id}
                    onSelect={() => void selectCity(item)}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
