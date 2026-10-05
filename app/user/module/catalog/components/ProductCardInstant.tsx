import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { discountPercent } from '@/lib/product-price';
import { cn } from '@/lib/utils';
import { formatInstantCardEta } from '@/module/catalog/lib/instant-card-copy';
import type { HomeProductInstant } from '@/module/home/lib/home-catalog';
import { Zap } from 'lucide-react-native';
import { View } from 'react-native';

/** Top-left on card image (web `ProductCardDiscountBadge`). */
export function ProductCardDiscountBadge({
  pricePaise,
  compareAtPaise,
  className,
}: {
  pricePaise: number;
  compareAtPaise?: number | null;
  className?: string;
}) {
  const percentOff = discountPercent(pricePaise, compareAtPaise);
  if (percentOff <= 0) return null;
  return (
    <View
      className={cn(
        'absolute left-2 top-2 z-[2] max-w-[85%] rounded-md border border-border/50 bg-card/95 px-2 py-0.5 shadow-sm',
        className,
      )}>
      <Text className="text-[10px] font-bold leading-tight text-primary" numberOfLines={1}>
        {percentOff}% off
      </Text>
    </View>
  );
}

type ProductCardInstantLineProps = {
  instant?: HomeProductInstant | null;
  size?: 'rail' | 'default';
  className?: string;
};

/** Instant label + ETA in card body (web parity — not on the photo). */
export function ProductCardInstantLine({
  instant,
  size = 'rail',
  className,
}: ProductCardInstantLineProps) {
  if (!instant?.enabled) return null;

  const eta = formatInstantCardEta(instant.etaMinutes);
  const showLabel = Boolean(instant.showBadge);
  const label = (instant.badgeLabel || 'Instant').trim() || 'Instant';

  if (!showLabel && !eta) return null;

  const parts: string[] = [];
  if (showLabel) parts.push(label);
  if (eta) parts.push(eta);

  const textClass = size === 'rail' ? 'text-[11px]' : 'text-xs';

  return (
    <View
      className={cn(
        'max-w-[62%] shrink-0 flex-row items-center gap-1',
        className,
      )}
      accessibilityLabel={
        eta
          ? `${showLabel ? `${label} · ` : ''}${eta} typical arrival after confirmation`
          : label
      }>
      <Icon as={Zap} size={12} className="shrink-0 text-instant" />
      <Text
        className={cn('min-w-0 shrink font-semibold leading-none text-instant tabular-nums', textClass)}
        numberOfLines={1}>
        {parts.join(' · ')}
      </Text>
    </View>
  );
}

/** Bottom-right on card image — crimson pill with Zap + label (optional ETA). */
export function ProductCardInstantImageBadge({
  instant,
  className,
}: {
  instant?: HomeProductInstant | null;
  className?: string;
}) {
  if (!instant?.enabled || !instant.showBadge) return null;

  const label = (instant.badgeLabel || 'Instant').trim() || 'Instant';
  const eta = formatInstantCardEta(instant.etaMinutes);
  const line = eta ? `${label} · ${eta}` : label;

  return (
    <View
      className={cn(
        'absolute bottom-2 right-2 z-10 max-w-[88%] flex-row items-center gap-1 rounded-pill bg-instant px-2 py-1 shadow-sm',
        className,
      )}
      accessibilityLabel={
        eta ? `${label} · ${eta} typical arrival after confirmation` : label
      }>
      <Icon as={Zap} size={11} className="shrink-0 text-instant-foreground" />
      <Text
        className="text-micro min-w-0 shrink font-semibold text-instant-foreground"
        numberOfLines={1}>
        {line}
      </Text>
    </View>
  );
}

/** @deprecated Use `ProductCardInstantImageBadge`. */
export function ProductCardInstantBadge(props: { instant?: HomeProductInstant | null }) {
  return <ProductCardInstantImageBadge {...props} />;
}

/** @deprecated Use `ProductCardInstantLine`. */
export function ProductCardInstantEta(props: ProductCardInstantLineProps) {
  return <ProductCardInstantLine {...props} />;
}
