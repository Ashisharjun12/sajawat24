import { ScalePressable } from '@/components/shell';
import { getProductForCatalogLocation } from '@/lib/catalog-location';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
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
import { useMemo } from 'react';
import { View } from 'react-native';

const LINE_IMAGE_PLACEHOLDER =
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=480&fit=crop';

const ADDON_THUMB_PLACEHOLDER =
  'https://images.unsplash.com/photo-1464349153735-7db50ed83c16?w=200&h=200&fit=crop';

const HERO_HEIGHT = 164;
const ADDON_THUMB = 40;

type ConfirmProductCardProps = {
  item: CartItemLine;
  scheduledAt?: string | null;
  cityId?: string | null;
  pincode?: string | null;
  onEdit?: () => void;
  onRemove?: () => void;
  removing?: boolean;
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

function AddonRow({ addon, imageUri }: { addon: CartAddonLine; imageUri: string }) {
  const free = addon.pricePaise == null || addon.pricePaise === 0;

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
      <Text className="text-foreground min-w-0 flex-1 text-sm leading-snug" numberOfLines={2}>
        {addon.name}
        {addon.quantity > 1 ? ` × ${addon.quantity}` : ''}
      </Text>
      {free ? (
        <Text className="text-sm font-medium text-emerald-600">Free</Text>
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

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <View className="w-full bg-muted" style={{ height: HERO_HEIGHT }}>
        <Image
          source={{ uri: heroSrc }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          accessibilityLabel={item.name}
        />
      </View>

      <View className="gap-3 p-4">
        <View className="flex-row items-start justify-between gap-3">
          <Text className="text-foreground min-w-0 flex-1 text-base font-semibold leading-snug">
            {checkoutLineTitle(item.name)}
          </Text>
          <Text className="text-foreground shrink-0 text-base font-semibold tabular-nums">
            {formatPaise(baseProductPaise(item, addons))}
          </Text>
        </View>

        {addons.length ? (
          <View className="gap-3 border-t border-border/60 pt-3">
            {addons.map((addon) => (
              <AddonRow key={addon.id} addon={addon} imageUri={resolveAddonImage(addon)} />
            ))}
          </View>
        ) : null}

        {slotLabel || onEdit || onRemove ? (
          <View className="flex-row items-center justify-between gap-3">
            {slotLabel ? (
              <View className="flex-row items-center gap-2 rounded-lg bg-sky-50 px-2.5 py-1.5 dark:bg-sky-950/40">
                <Icon as={CalendarDays} className="size-3.5 text-sky-600" />
                <Text className="text-xs font-medium text-sky-700 dark:text-sky-400">{slotLabel}</Text>
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
    </View>
  );
}
