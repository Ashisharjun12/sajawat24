import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { CheckoutSavingsBanner } from '@/module/booking/components/checkout/CheckoutSavingsBanner';
import { formatPaise } from '@/lib/format-money';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CheckoutProceedBarProps = {
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  ctaLabel: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  footerNote?: ReactNode;
};

/** Flipkart-style sticky checkout: savings strip + price left, CTA right. */
export function CheckoutProceedBar({
  subtotalPaise,
  discountPaise,
  totalPaise,
  ctaLabel,
  disabled = false,
  loading = false,
  onPress,
  footerNote,
}: CheckoutProceedBarProps) {
  const insets = useSafeAreaInsets();
  const savings = Math.max(0, discountPaise);
  const showStrike = savings > 0 && subtotalPaise > totalPaise;

  return (
    <View
      className="absolute inset-x-0 bottom-0 border-t border-border/60 bg-surface shadow-lg"
      style={{
        paddingBottom: Math.max(insets.bottom, 12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 12,
      }}>
      <CheckoutSavingsBanner savingsPaise={savings} variant="strip" />

      <View className="flex-row items-center gap-3 px-4 pt-3">
        <View className="min-w-[88px] shrink-0 justify-center">
          {showStrike ? (
            <Text className="text-muted-foreground text-sm line-through tabular-nums">
              {formatPaise(subtotalPaise)}
            </Text>
          ) : null}
          <Text className="text-foreground text-xl font-bold tabular-nums">
            {formatPaise(totalPaise)}
          </Text>
        </View>

        <Button
          variant="cta"
          className="min-h-12 flex-1 rounded-btn"
          disabled={disabled}
          loading={loading}
          onPress={onPress}>
          <Text className="text-center font-semibold" numberOfLines={1}>{ctaLabel}</Text>
        </Button>
      </View>

      {footerNote ? <View className="px-4 pb-1 pt-1">{footerNote}</View> : null}
    </View>
  );
}

/** Scroll padding for screens that use `CheckoutProceedBar`. */
export function checkoutProceedBarScrollPad(
  insetsBottom: number,
  hasSavingsStrip: boolean,
  extra = 0,
): number {
  const base = 88 + Math.max(insetsBottom, 12) + extra;
  return hasSavingsStrip ? base + 40 : base;
}
