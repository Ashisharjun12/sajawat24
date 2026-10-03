import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { autocompletePlaces, getPlaceDetails } from '@/api/maps.api';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, TouchableOpacity, View } from 'react-native';

export type PlaceResolvedPayload = {
  address: string;
  pincode: string | null;
  latitude: number;
  longitude: number;
};

type PlacesAddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onPlaceResolved?: (payload: PlaceResolvedPayload) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onSuggestionsOpenChange?: (open: boolean) => void;
  /** `inline` for forms inside ScrollView; `absolute` for map overlays */
  dropdownLayout?: 'absolute' | 'inline';
};

export function PlacesAddressAutocomplete({
  value,
  onChange,
  onPlaceResolved,
  placeholder = 'Search area, street, building…',
  disabled,
  className,
  onSuggestionsOpenChange,
  dropdownLayout = 'absolute',
}: PlacesAddressAutocompleteProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ placeId: string; description: string }[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const skipSearchRef = useRef(false);
  const selectingRef = useRef(false);
  const [text, setText] = useState(value);

  useEffect(() => {
    if (selectingRef.current) return;
    setText(value);
  }, [value]);

  function setSuggestionsOpen(next: boolean) {
    setOpen(next);
    onSuggestionsOpenChange?.(next);
  }

  useEffect(() => {
    const trimmed = (value ?? '').trim();
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    if (trimmed.length < 3) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      void autocompletePlaces(trimmed, { sessionToken: sessionRef.current })
        .then((items) => {
          setSuggestions(items);
          setSuggestionsOpen(items.length > 0);
        })
        .catch(() => {
          setSuggestions([]);
          setSuggestionsOpen(false);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  function closeSuggestions(dismissKeyboard = false) {
    setSuggestions([]);
    setSuggestionsOpen(false);
    if (dismissKeyboard) Keyboard.dismiss();
  }

  async function handleSelect(item: { placeId: string; description: string }) {
    selectingRef.current = true;
    skipSearchRef.current = true;
    closeSuggestions(false);

    const line = item.description;
    setText(line);
    onChange(line);

    try {
      const details = await getPlaceDetails(item.placeId, sessionRef.current);
      sessionRef.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const address = details.formattedAddress || line;
      setText(address);
      onChange(address);
      onPlaceResolved?.({
        address,
        pincode: details.pincode ?? null,
        latitude: details.latitude,
        longitude: details.longitude,
      });
    } catch {
      // keep line already written to the field
    } finally {
      selectingRef.current = false;
      Keyboard.dismiss();
    }
  }

  const listShellClass =
    'border-border overflow-hidden rounded-xl border bg-background shadow-lg';
  const listMaxHeight = 220;

  function SuggestionList() {
    if (!open || suggestions.length === 0) return null;
    return (
      <ScrollView
        nestedScrollEnabled
        keyboardShouldPersistTaps="always"
        style={{ maxHeight: listMaxHeight }}
        className={dropdownLayout === 'inline' ? `mt-1 ${listShellClass}` : listShellClass}
        showsVerticalScrollIndicator>
        {suggestions.map((item) => (
          <TouchableOpacity
            key={item.placeId}
            activeOpacity={0.65}
            onPress={() => void handleSelect(item)}>
            <View className="border-b border-border/60 px-3 py-3">
              <Text className="text-foreground text-sm leading-5">{item.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  return (
    <View className={dropdownLayout === 'absolute' ? 'relative' : undefined}>
      <Input
        value={text}
        onChangeText={(next) => {
          selectingRef.current = false;
          skipSearchRef.current = false;
          setText(next);
          onChange(next);
        }}
        onFocus={() => {
          if (!skipSearchRef.current && suggestions.length > 0) setSuggestionsOpen(true);
        }}
        placeholder={placeholder}
        editable={!disabled}
        autoCorrect={false}
        className={className}
      />
      {loading ? <Text className="text-muted-foreground mt-1 text-xs">Searching…</Text> : null}
      {dropdownLayout === 'inline' ? (
        <SuggestionList />
      ) : open && suggestions.length > 0 ? (
        <View
          className={`absolute left-0 right-0 top-full z-50 mt-1 ${listShellClass}`}
          style={{ elevation: 12, maxHeight: listMaxHeight }}>
          <SuggestionList />
        </View>
      ) : null}
    </View>
  );
}
