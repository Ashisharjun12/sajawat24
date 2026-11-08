import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  buildCouponPreviewFromApplied,
  type CouponLike,
} from '@/module/booking/lib/coupon-preview';
import { resolveCouponCode } from '@/module/promotions/lib/pdp-coupon-display';
import { DiscountSeal } from '@/components/ui/discount-seal';
import { cn } from '@/lib/utils';
import { TicketPercent } from 'lucide-react-native';
import { View } from 'react-native';

/** Offer-card code title — deep navy, like a brand wordmark. */
const COUPON_CODE_HEX = '#13306B';

const TICKET_TONES = [
  { bg: 'bg-primary', notch: 'bg-primary' },
] as const;

type CouponTicketCardProps = {
  coupon: CouponLike;
  index: number;
  onPress: () => void;
  layout?: 'rail' | 'stack';
  variant?: 'ticket' | 'minimal';
};

export function CouponTicketCard({
  coupon,
  index,
  onPress,
  layout = 'rail',
  variant = 'ticket',
}: CouponTicketCardProps) {
  const code = resolveCouponCode(coupon);
  const preview = buildCouponPreviewFromApplied({ ...coupon, code: code || coupon.code });
  if (!code || !preview) return null;

  const title = String(coupon.name ?? coupon.title ?? preview.label).trim();
  const subtitle =
    preview.subtitle ||
    (preview.badge ? preview.badge.toLowerCase() : 'Special offer');

  const isStack = layout === 'stack';

  if (variant === 'minimal') {
    // Offer card: code as the bold "brand" line, description below, green % seal top-right.
    const description = title && title.toUpperCase() !== code.toUpperCase()
      ? `${preview.discount} · ${title}`
      : `${preview.discount} · ${subtitle}`;

    return (
      <ScalePressable
        haptic
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Coupon ${preview.code}. ${description}`}
        className={cn(layout === 'stack' ? 'w-full self-stretch' : 'mr-3 w-[240px]')}>
        <View
          className={cn(
            'relative min-h-[96px] overflow-hidden rounded-xl border border-border/80 bg-card',
            isStack ? 'px-4 py-3.5' : 'px-3.5 pb-3 pt-3.5',
          )}>
          <Text
            className="pr-12 text-[19px] font-bold uppercase tracking-wide"
            style={{ color: COUPON_CODE_HEX }}
            numberOfLines={1}>
            {code}
          </Text>
          <Text
            className="mt-2 text-[13px] leading-[19px] text-foreground/85"
            numberOfLines={2}>
            {description}
          </Text>
          {/* Seal pushed into the top-right corner; the card clips its top and right edges. */}
          <View className="absolute" style={{ top: -7, right: -7 }}>
            <DiscountSeal size={46} />
          </View>
        </View>
      </ScalePressable>
    );
  }

  const tone = TICKET_TONES[index % TICKET_TONES.length];

  return (
    <ScalePressable
      haptic
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Coupon ${preview.code}`}
      className={cn(layout === 'stack' ? 'w-full self-stretch' : 'mr-3 w-[196px]')}>
      <View className={cn('overflow-hidden rounded-xl', tone.bg)}>
        <View
          className={cn(
            'flex-row items-start gap-2.5',
            isStack ? 'px-4 pb-3.5 pt-4' : 'px-3.5 pb-2 pt-3',
          )}>
          <View className="min-w-0 flex-1">
            <Text
              className={cn(
                'text-primary-foreground/90 font-semibold uppercase tracking-wide',
                isStack ? 'text-[10px]' : 'text-[9px]',
              )}
              numberOfLines={1}>
              {title}
            </Text>
            <Text
              className={cn(
                'text-primary-foreground mt-1 font-bold leading-snug',
                isStack ? 'text-h1' : 'text-h2',
              )}
              numberOfLines={1}>
              {preview.discount}
            </Text>
            <Text
              className={cn('text-primary-foreground/85 mt-0.5', isStack ? 'text-xs' : 'text-[10px]')}
              numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          <View className={cn('rounded-full bg-white/20', isStack ? 'p-2' : 'p-1.5')}>
            <Icon as={TicketPercent} className={cn('text-primary-foreground', isStack ? 'size-5' : 'size-4')} />
          </View>
        </View>

        <View className={cn('relative flex-row items-center px-2', isStack ? 'py-2' : 'py-1.5')}>
          <View className="absolute -left-2 size-3.5 rounded-full bg-background" />
          <View className="mx-1 flex-1 border-t border-dashed border-white/50" />
          <View className="absolute -right-2 size-3.5 rounded-full bg-background" />
        </View>

        <View className={cn('items-center px-3', isStack ? 'pb-3.5 pt-1' : 'pb-2.5 pt-0.5')}>
          <View className={cn('rounded-full bg-white', isStack ? 'px-4 py-1.5' : 'px-3.5 py-1')}>
            <Text className={cn('text-foreground font-bold', isStack ? 'text-xs' : 'text-[11px]')}>
              View
            </Text>
          </View>
        </View>
      </View>
    </ScalePressable>
  );
}
