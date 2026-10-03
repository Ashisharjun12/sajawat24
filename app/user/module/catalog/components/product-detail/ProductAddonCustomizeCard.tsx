import { ScalePressable } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import {
  addonDiscountPercent,
  addonMaxQuantity,
  isAddonAvailable,
  isAddonFree,
} from '@/module/catalog/lib/addon-pricing';
import { addonImageUrl, type PublicAddonForCity } from '@/module/catalog/lib/product-detail';
import { Image } from 'expo-image';
import { Minus, Plus } from 'lucide-react-native';
import { View } from 'react-native';

/** Image spans full card width (two cards fill the rail row). */
export const ADDON_IMAGE_SIZE_RATIO = 1;

export const ADDON_CARD_GAP = 12;

export function getAddonRailSnapInterval(cardWidth: number) {
  return cardWidth + ADDON_CARD_GAP;
}

const CARD_BODY_PADDING_V = 16;
const CARD_SECTION_GAP = 6;
const CARD_TITLE_MIN = 30;
const CARD_PRICE_BLOCK_MIN = 32;
const CARD_ACTION_MIN = 34;
const CARD_COLOR_ROW_MIN = 30;

export function getAddonImageSize(cardWidth: number) {
  return Math.round(cardWidth * ADDON_IMAGE_SIZE_RATIO);
}

function getAddonCardBodyHeight() {
  return (
    CARD_BODY_PADDING_V +
    CARD_TITLE_MIN +
    CARD_PRICE_BLOCK_MIN +
    CARD_SECTION_GAP +
    CARD_ACTION_MIN +
    CARD_SECTION_GAP +
    CARD_COLOR_ROW_MIN
  );
}

/** Total card height for a given rail card width (square image + fixed body slots). */
export function getAddonCustomizeCardHeight(cardWidth: number) {
  return getAddonImageSize(cardWidth) + getAddonCardBodyHeight();
}

function AddonColorSwatch({ hex, name }: { hex: string; name?: string | null }) {
  const label = name?.trim() || 'Color';
  return (
    <View
      className="flex-row items-center justify-center gap-1.5 border-t border-border/50 pt-2"
      accessibilityLabel={`Color: ${label}`}>
      <View
        className="size-3.5 rounded-full border-2 border-background"
        style={{
          backgroundColor: hex,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.12,
          shadowRadius: 2,
          elevation: 2,
        }}
      />
      <Text className="text-muted-foreground min-w-0 flex-1 text-center text-[10px] font-medium" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

type ProductAddonCustomizeCardProps = {
  addon: PublicAddonForCity;
  width: number;
  qty: number;
  submitting: boolean;
  onToggle: (addon: PublicAddonForCity) => void;
  onIncrement: (addon: PublicAddonForCity) => void;
  onSetQty: (addonId: string, qty: number) => void;
};

export function ProductAddonCustomizeCard({
  addon,
  width,
  qty,
  submitting,
  onToggle,
  onIncrement,
  onSetQty,
}: ProductAddonCustomizeCardProps) {
  const available = isAddonAvailable(addon.pricePaise);
  const max = addonMaxQuantity(addon);
  const multi = max > 1;
  const src = addonImageUrl(addon);
  const percentOff = addonDiscountPercent(addon.pricePaise, addon.compareAtPaise);
  const imageSize = getAddonImageSize(width);
  const colorHex = addon.color?.hex?.trim();
  const cardHeight = getAddonCustomizeCardHeight(width);
  const bodyHeight = getAddonCardBodyHeight();

  return (
    <View
      style={{ width, height: cardHeight }}
      className={`rounded-xl border border-border/80 bg-card ${!available ? 'opacity-60' : ''}`}>
      <View
        style={{ width, height: imageSize }}
        className="overflow-hidden rounded-t-xl bg-muted">
        {src ? (
          <Image
            source={{ uri: src }}
            style={{ width, height: imageSize }}
            contentFit="cover"
          />
        ) : null}
      </View>
      <View style={{ height: bodyHeight }} className="overflow-hidden rounded-b-xl p-2">
        <View style={{ height: CARD_TITLE_MIN }}>
          <Text className="text-foreground text-[11px] font-semibold leading-snug" numberOfLines={2}>
            {addon.name}
          </Text>
        </View>
        <View style={{ height: CARD_PRICE_BLOCK_MIN }} className="justify-center gap-0.5">
          {!available ? (
            <Text className="text-muted-foreground text-[11px]">Unavailable</Text>
          ) : isAddonFree(addon.pricePaise) ? (
            <Text className="text-xs font-bold text-emerald-600">Free</Text>
          ) : (
            <Text className="text-xs font-extrabold">{formatPaise(addon.pricePaise ?? 0)}</Text>
          )}
          {percentOff > 0 ? (
            <Text className="text-[10px] font-bold text-emerald-600">{percentOff}% OFF</Text>
          ) : null}
        </View>
        <View style={{ height: CARD_SECTION_GAP }} />
        <View style={{ height: CARD_ACTION_MIN }} className="justify-center">
          {multi && qty > 0 ? (
            <View className="flex-row items-center justify-between rounded-full border border-border bg-muted/40 p-0.5">
              <ScalePressable
                haptic
                onPress={() => onSetQty(addon.id, Math.max(0, qty - 1))}
                className="size-7 items-center justify-center">
                <Icon as={Minus} className="size-3.5" />
              </ScalePressable>
              <Text className="text-xs font-bold">{qty}</Text>
              <ScalePressable
                haptic
                onPress={() => onIncrement(addon)}
                className="size-7 items-center justify-center">
                <Icon as={Plus} className="size-3.5" />
              </ScalePressable>
            </View>
          ) : (
            <Button
              variant={qty > 0 ? 'default' : 'outline'}
              size="sm"
              className="h-8"
              disabled={submitting || !available}
              onPress={() => (multi ? onIncrement(addon) : onToggle(addon))}>
              <Text className="text-[11px] font-bold">
                {!available ? 'Unavailable' : qty > 0 ? 'Added' : '+ Add'}
              </Text>
            </Button>
          )}
        </View>
        <View style={{ height: CARD_SECTION_GAP }} />
        <View style={{ height: CARD_COLOR_ROW_MIN }} className="justify-end">
          {colorHex ? <AddonColorSwatch hex={colorHex} name={addon.color?.name} /> : null}
        </View>
      </View>
    </View>
  );
}
