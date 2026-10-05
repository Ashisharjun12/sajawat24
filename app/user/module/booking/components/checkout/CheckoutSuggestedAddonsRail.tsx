import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  ADDON_CARD_GAP,
  ProductAddonCustomizeCard,
  getAddonCustomizeCardHeight,
  getAddonRailSnapInterval,
} from '@/module/catalog/components/product-detail/ProductAddonCustomizeCard';
import type { useCheckoutLineAddons } from '@/module/booking/hooks/use-checkout-line-addons';
import { checkoutSectionShell } from '@/module/booking/lib/checkout-section-shell';
import { cn } from '@/lib/utils';
import type { CartItemLine, CartSnapshot } from '@/module/booking/lib/cart-types';
import type { PublicAddonForCity } from '@/module/catalog/lib/product-detail';
import { Gift } from 'lucide-react-native';
import { FlatList, View } from 'react-native';

const CARD_WIDTH = 140;

type LineAddonControls = ReturnType<typeof useCheckoutLineAddons>;

type CheckoutSuggestedAddonsRailProps = {
  item: CartItemLine;
  cart: CartSnapshot;
  lineAddons: LineAddonControls;
  catalogAddons: PublicAddonForCity[];
  fullBleed?: boolean;
};

export function CheckoutSuggestedAddonsRail({
  lineAddons,
  catalogAddons,
  fullBleed = false,
}: CheckoutSuggestedAddonsRailProps) {
  const { qtyById, pendingAddonId, setQty, increment, toggle } = lineAddons;

  const listHeight = getAddonCustomizeCardHeight(CARD_WIDTH);
  const snapInterval = getAddonRailSnapInterval(CARD_WIDTH);

  if (!catalogAddons.length) return null;

  return (
    <View className={cn('gap-3 py-4', checkoutSectionShell(!fullBleed))}>
      <View className="flex-row items-start gap-2.5 px-4">
        <View className="size-9 shrink-0 items-center justify-center rounded-full bg-primary-tint">
          <Icon as={Gift} className="size-4 text-primary" strokeWidth={2} />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-foreground text-base font-semibold">Suggested add-ons</Text>
          <Text className="text-muted-foreground text-sm leading-snug">
            Optional extras for your setup — scroll and tap Add
          </Text>
        </View>
      </View>

      <FlatList
        data={catalogAddons}
        keyExtractor={(row) => row.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum
        style={{ height: listHeight, flexGrow: 0 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: ADDON_CARD_GAP,
          alignItems: 'stretch',
        }}
        renderItem={({ item: addon }) => (
          <ProductAddonCustomizeCard
            addon={addon}
            width={CARD_WIDTH}
            qty={qtyById[addon.id] ?? 0}
            busy={pendingAddonId === addon.id}
            onToggle={(a) => toggle(a.id)}
            onIncrement={(a) => increment(a.id)}
            onSetQty={setQty}
          />
        )}
      />
    </View>
  );
}
