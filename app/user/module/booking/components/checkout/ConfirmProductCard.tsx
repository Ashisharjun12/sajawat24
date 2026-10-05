import { ScalePressable } from '@/components/shell';
import { getProductForCatalogLocation } from '@/lib/catalog-location';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { discountPercent } from '@/lib/product-price';
import { isBackendCityId } from '@/lib/location-label';
import { checkoutLineTitle } from '@/module/booking/lib/checkout-line-title';
import { formatCartSlotLabel } from '@/module/booking/lib/format-cart-slot';
import type { CartAddonLine, CartItemLine } from '@/module/booking/lib/cart-types';
import {
  addonImageUrl,
  productImageUrls,
  type CatalogProductDetail,
} from '@/module/catalog/lib/product-detail';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Pencil } from 'lucide-react-native';
import { Image } from 'expo-image';
import { checkoutSectionShell } from '@/module/booking/lib/checkout-section-shell';
import type { useCheckoutLineAddons } from '@/module/booking/hooks/use-checkout-line-addons';
import { AddonQtyControl } from '@/module/catalog/components/product-detail/AddonQtyControl';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { View } from 'react-native';

type LineAddonControls = ReturnType<typeof useCheckoutLineAddons>;

const LINE_IMAGE_PLACEHOLDER =
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=480&fit=crop';

const ADDON_THUMB_PLACEHOLDER =
  'https://images.unsplash.com/photo-1464349153735-7db50ed83c16?w=200&h=200&fit=crop';

const PRODUCT_THUMB = 88;
const ADDON_THUMB = 40;

type ConfirmProductCardProps = {
  item: CartItemLine;
  scheduledAt?: string | null;
  cityId?: string | null;
  pincode?: string | null;
  onEdit?: () => void;
  onRemove?: () => void;
  removing?: boolean;
  fullBleed?: boolean;
  lineAddons?: LineAddonControls;
};

function useCheckoutLineProduct(
  item: CartItemLine,
  cityId?: string | null,
  pincode?: string | null,
) {
  const serviceCityId = cityId && isBackendCityId(cityId) ? cityId : undefined;
  const pin = pincode?.replace(/\D/g, '').slice(0, 6) || undefined;

  return useQuery({
    queryKey: ['checkout-line-detail', item.productId, serviceCityId, pin],
    queryFn: async () =>
      (await getProductForCatalogLocation(item.productId, {
        cityId: serviceCityId,
        pincode: pin,
      })) as CatalogProductDetail,
    enabled: Boolean(item.productId) && Boolean(serviceCityId || pin),
    staleTime: 120_000,
  });
}

/** Product price without add-ons, so the card lines add up to the item total. */
function baseProductPaise(item: CartItemLine, addons: CartAddonLine[]) {
  const qty = item.quantity ?? 1;
  if (item.productPaise) return item.productPaise * qty;
  const addonsTotal = addons.reduce((sum, a) => sum + (a.pricePaise ?? 0), 0);
  return Math.max(0, item.lineTotalPaise - addonsTotal);
}

function AddonRow({
  addon,
  imageUri,
  qty,
  max,
  busy,
  lineAddons,
}: {
  addon: CartAddonLine;
  imageUri: string;
  qty: number;
  max: number;
  busy: boolean;
  lineAddons?: LineAddonControls;
}) {
  const free = addon.pricePaise == null || addon.pricePaise === 0;
  const lineTotal =
    free || addon.pricePaise == null ? null : formatPaise((addon.pricePaise ?? 0) * qty);

  return (
    <View className="flex-row items-center gap-3">
      <View
        className="overflow-hidden rounded-lg bg-muted"
        style={{ width: ADDON_THUMB, height: ADDON_THUMB }}>
        <Image
          source={{ uri: imageUri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-foreground text-sm leading-snug" numberOfLines={2}>
          {addon.name}
        </Text>
        {free ? (
          <Text className="text-sm font-medium text-success">Free</Text>
        ) : lineTotal ? (
          <Text className="text-foreground text-sm font-medium tabular-nums">{lineTotal}</Text>
        ) : null}
      </View>
      {lineAddons ? (
        <View className={cn('shrink-0', busy ? 'opacity-80' : undefined)}>
          <AddonQtyControl
            compact
            qty={qty}
            max={max}
            onAdd={() => lineAddons.increment(addon.id)}
            onIncrement={() => lineAddons.increment(addon.id)}
            onDecrement={() => lineAddons.decrement(addon.id)}
          />
        </View>
      ) : free ? (
        <Text className="text-sm font-medium text-success">Free</Text>
      ) : (
        <Text className="text-foreground text-sm font-medium tabular-nums">
          {formatPaise(addon.pricePaise ?? 0)}
        </Text>
      )}
    </View>
  );
}

export function ConfirmProductCard({
  item,
  scheduledAt,
  cityId,
  pincode,
  onEdit,
  onRemove,
  removing = false,
  fullBleed = false,
  lineAddons,
}: ConfirmProductCardProps) {
  const slotLabel = formatCartSlotLabel(scheduledAt);
  const addons = (item.addons ?? []).filter((a) => (a.quantity ?? 0) > 0);
  const productQuery = useCheckoutLineProduct(item, cityId, pincode);

  const addonImageById = useMemo(() => {
    const map = new Map<string, string>();
    for (const addon of productQuery.data?.addons ?? []) {
      const url = addonImageUrl(addon);
      if (url) map.set(addon.id, url);
    }
    return map;
  }, [productQuery.data?.addons]);

  const heroSrc = useMemo(() => {
    const fromCart = item.imageUrl?.trim();
    if (fromCart) return fromCart;
    const urls = productImageUrls(productQuery.data?.images);
    return urls[0] || LINE_IMAGE_PLACEHOLDER;
  }, [item.imageUrl, productQuery.data?.images]);

  function resolveAddonImage(addon: CartAddonLine) {
    return addon.imageUrl?.trim() || addonImageById.get(addon.id) || ADDON_THUMB_PLACEHOLDER;
  }

  const qty = item.quantity ?? 1;
  const lineProductPaise = baseProductPaise(item, addons);
  const unitPricePaise =
    item.productPaise ?? (qty > 0 ? Math.round(lineProductPaise / qty) : lineProductPaise);
  const compareAtUnit = productQuery.data?.compareAtPaise ?? null;
  const compareAtLinePaise =
    compareAtUnit != null && compareAtUnit > unitPricePaise ? compareAtUnit * qty : null;
  const percentOff = discountPercent(unitPricePaise, compareAtUnit);

  return (
    <View className={cn('overflow-hidden', checkoutSectionShell(!fullBleed))}>
      <View className="flex-row gap-3 p-4">
        <View
          className="shrink-0 overflow-hidden rounded-xl bg-muted"
          style={{ width: PRODUCT_THUMB, height: PRODUCT_THUMB }}>
          <Image
            source={{ uri: heroSrc }}
            style={{ width: PRODUCT_THUMB, height: PRODUCT_THUMB }}
            contentFit="cover"
            transition={200}
            accessibilityLabel={item.name}
          />
        </View>

        <View className="min-w-0 flex-1 gap-1.5">
          <Text className="text-foreground text-base font-semibold leading-snug" numberOfLines={3}>
            {checkoutLineTitle(item.name)}
          </Text>
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
            <Text className="text-foreground text-lg font-bold tabular-nums">
              {formatPaise(lineProductPaise)}
            </Text>
            {compareAtLinePaise != null ? (
              <Text className="text-muted-foreground text-sm line-through tabular-nums">
                {formatPaise(compareAtLinePaise)}
              </Text>
            ) : null}
            {percentOff > 0 ? (
              <Text className="text-primary text-sm font-bold">{percentOff}% off</Text>
            ) : null}
          </View>
          {qty > 1 ? (
            <Text className="text-muted-foreground text-xs">Qty {qty}</Text>
          ) : null}
        </View>
      </View>

      {addons.length || slotLabel || onEdit || onRemove ? (
      <View className="gap-3 px-4 pb-4">
        {addons.length ? (
          <View className="gap-3 border-t border-border/60 pt-3">
            {addons.map((addon) => {
              const qty = lineAddons?.qtyById[addon.id] ?? addon.quantity ?? 0;
              const max = lineAddons?.resolveMax(addon.id) ?? 99;
              const busy = lineAddons?.pendingAddonId === addon.id;
              return (
                <AddonRow
                  key={addon.id}
                  addon={addon}
                  imageUri={resolveAddonImage(addon)}
                  qty={qty}
                  max={max}
                  busy={Boolean(busy)}
                  lineAddons={lineAddons}
                />
              );
            })}
          </View>
        ) : null}

        {slotLabel || onEdit || onRemove ? (
          <View className="flex-row items-center justify-between gap-3 border-t border-border/60 pt-3">
            {slotLabel ? (
              <View className="flex-row items-center gap-2 rounded-lg bg-primary-tint px-2.5 py-1.5">
                <Icon as={CalendarDays} className="size-3.5 text-primary" />
                <Text className="text-xs font-medium text-primary">{slotLabel}</Text>
              </View>
            ) : (
              <View className="flex-1" />
            )}
            <View className="flex-row items-center gap-4">
              {onRemove ? (
                <ScalePressable
                  haptic
                  onPress={onRemove}
                  disabled={removing}
                  accessibilityRole="button"
                  accessibilityLabel="Remove from cart"
                  hitSlop={8}
                  className="py-1.5">
                  <Text
                    className={
                      removing
                        ? 'text-muted-foreground text-sm font-semibold'
                        : 'text-destructive text-sm font-semibold'
                    }>
                    {removing ? 'Removing…' : 'Remove'}
                  </Text>
                </ScalePressable>
              ) : null}
              {onEdit ? (
                <ScalePressable
                  haptic
                  onPress={onEdit}
                  disabled={removing}
                  accessibilityRole="button"
                  accessibilityLabel="Edit package or time slot"
                  hitSlop={8}
                  className="flex-row items-center gap-1.5 py-1.5">
                  <Icon as={Pencil} className="text-foreground size-3.5" />
                  <Text className="text-foreground text-sm font-semibold">Edit</Text>
                </ScalePressable>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
      ) : null}
    </View>
  );
}
