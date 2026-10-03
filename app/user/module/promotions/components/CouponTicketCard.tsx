import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  buildCouponPreviewFromApplied,
  type CouponLike,
} from '@/module/booking/lib/coupon-preview';
import { resolveCouponCode } from '@/module/promotions/lib/pdp-coupon-display';
import { cn } from '@/lib/utils';
import { TicketPercent } from 'lucide-react-native';
import { View } from 'react-native';

const TICKET_TONES = [
  { bg: 'bg-sky-500', notch: 'bg-sky-500' },
  { bg: 'bg-amber-500', notch: 'bg-amber-500' },
  { bg: 'bg-violet-500', notch: 'bg-violet-500' },
  { bg: 'bg-emerald-500', notch: 'bg-emerald-500' },
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
    return (
      <ScalePressable
        haptic
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Coupon ${preview.code}`}
        className={cn(layout === 'stack' ? 'w-full self-stretch' : 'mr-3 w-[168px]')}>
        <View
          className={cn(
            'rounded-2xl border border-border bg-card',
            isStack ? 'px-4 py-3.5' : 'px-3.5 py-3',
          )}>
          <View className="flex-row items-start gap-2.5">
            <View className="size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/40">
              <Icon as={TicketPercent} className="size-4 text-sky-600 dark:text-sky-400" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-foreground text-sm font-semibold leading-snug" numberOfLines={2}>
                {preview.discount}
              </Text>
              {title ? (
                <Text className="text-muted-foreground mt-1 text-xs leading-snug" numberOfLines={2}>
                  {title}
                </Text>
              ) : null}
              <Text className="text-foreground mt-2 text-xs font-semibold tracking-wide" numberOfLines={1}>
                {code}
              </Text>
            </View>
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
                'text-white/90 font-semibold uppercase tracking-wide',
                isStack ? 'text-[10px]' : 'text-[9px]',
              )}
              numberOfLines={1}>
              {title}
            </Text>
            <Text
              className={cn(
                'text-white mt-1 font-bold leading-snug',
                isStack ? 'text-2xl' : 'text-lg',
              )}
              numberOfLines={1}>
              {preview.discount}
            </Text>
            <Text
              className={cn('text-white/85 mt-0.5', isStack ? 'text-xs' : 'text-[10px]')}
              numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          <View className={cn('rounded-full bg-white/20', isStack ? 'p-2' : 'p-1.5')}>
            <Icon as={TicketPercent} className={cn('text-white', isStack ? 'size-5' : 'size-4')} />
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
