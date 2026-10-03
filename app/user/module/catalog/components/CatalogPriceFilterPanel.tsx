import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

function paiseToRupees(paise: number) {
  return Math.round(Number(paise) / 100);
}

type CatalogPriceFilterPanelProps = {
  visible: boolean;
  facetMaxPaise: number;
  appliedMinRupees: number | null;
  appliedMaxRupees: number | null;
  disabled?: boolean;
  onClose: () => void;
  onApply: (patch: { minRupees: number | null; maxRupees: number | null }) => void;
};

export function CatalogPriceFilterPanel({
  visible,
  facetMaxPaise,
  appliedMinRupees,
  appliedMaxRupees,
  disabled = false,
  onClose,
  onApply,
}: CatalogPriceFilterPanelProps) {
  const bounds = useMemo(() => {
    const maxR = Math.max(1, paiseToRupees(facetMaxPaise));
    return { min: 0, max: maxR };
  }, [facetMaxPaise]);

  const appliedMin = appliedMinRupees ?? bounds.min;
  const appliedMax = appliedMaxRupees ?? bounds.max;

  const [minDraft, setMinDraft] = useState(String(appliedMin));
  const [maxDraft, setMaxDraft] = useState(String(appliedMax));

  useEffect(() => {
    if (visible) {
      setMinDraft(String(appliedMin));
      setMaxDraft(String(appliedMax));
    }
  }, [visible, appliedMin, appliedMax]);

  const rangeReady = facetMaxPaise > 0;

  function parseRupees(value: string) {
    const n = Number(value.replace(/\D/g, ''));
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.round(n);
  }

  function handleApply() {
    const low = Math.min(parseRupees(minDraft), parseRupees(maxDraft));
    const high = Math.max(parseRupees(minDraft), parseRupees(maxDraft));
    const isFullRange = low <= bounds.min && high >= bounds.max;
    onApply(
      isFullRange
        ? { minRupees: null, maxRupees: null }
        : {
            minRupees: low > 0 ? low : null,
            maxRupees: high < bounds.max ? high : null,
          },
    );
    onClose();
  }

  function handleClear() {
    onApply({ minRupees: null, maxRupees: null });
    onClose();
  }

  if (!rangeReady) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="rounded-t-3xl bg-background px-5 pb-8 pt-4"
          onPress={(e) => e.stopPropagation()}>
          <Text className="text-foreground text-lg font-semibold">Custom price</Text>
          <Text className="text-muted-foreground mt-1 text-sm">
            Range up to {formatPaise(bounds.max * 100)}
          </Text>

          <View className="mt-5 flex-row items-center gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-muted-foreground mb-1.5 text-xs font-medium">Min (₹)</Text>
              <Input
                value={minDraft}
                onChangeText={setMinDraft}
                keyboardType="number-pad"
                editable={!disabled}
                className="h-11 rounded-xl"
                placeholder="0"
              />
            </View>
            <Text className="text-muted-foreground pt-5">—</Text>
            <View className="min-w-0 flex-1">
              <Text className="text-muted-foreground mb-1.5 text-xs font-medium">Max (₹)</Text>
              <Input
                value={maxDraft}
                onChangeText={setMaxDraft}
                keyboardType="number-pad"
                editable={!disabled}
                className="h-11 rounded-xl"
                placeholder={String(bounds.max)}
              />
            </View>
          </View>

          <View className="mt-6 flex-row gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onPress={handleClear} disabled={disabled}>
              <Text>Clear</Text>
            </Button>
            <Button className="flex-1 rounded-xl" onPress={handleApply} disabled={disabled}>
              <Text>Apply</Text>
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
