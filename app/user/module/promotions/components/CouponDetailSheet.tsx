import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  buildCouponPreviewFromApplied,
  type CouponLike,
  type CouponConditionIcon,
} from '@/module/booking/lib/coupon-preview';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import * as Clipboard from 'expo-clipboard';
import {
  Clock,
  Copy,
  CreditCard,
  MapPin,
  ShoppingBag,
} from 'lucide-react-native';
import { useCallback } from 'react';
import { Alert, ScrollView, View } from 'react-native';

const CONDITION_ICONS: Record<CouponConditionIcon, typeof ShoppingBag> = {
  bag: ShoppingBag,
  clock: Clock,
  card: CreditCard,
  pin: MapPin,
};

type CouponDetailSheetProps = {
  coupon: CouponLike | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CouponDetailSheet({ coupon, open, onOpenChange }: CouponDetailSheetProps) {
  const preview = coupon ? buildCouponPreviewFromApplied(coupon) : null;

  const copyCode = useCallback(async () => {
    if (!preview?.code) return;
    try {
      await Clipboard.setStringAsync(preview.code);
      Alert.alert('Code copied', preview.code);
    } catch {
      Alert.alert('Could not copy code');
    }
  }, [preview?.code]);

  return (
    <HomeBottomSheetModal
      visible={open}
      onClose={() => onOpenChange(false)}
      closeAccessibilityLabel="Close coupon details">
      {preview ? (
        <ScrollView
          className="max-h-[70vh] px-5 pt-2"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View className="border-b border-border/60 pb-4">
            <Text className="text-foreground text-xl font-semibold">{preview.discount}</Text>
            <Text className="text-muted-foreground mt-1 text-sm">
              {coupon?.name || coupon?.title || preview.label}
            </Text>
          </View>

          <View className="mt-4 gap-4">
            <View className="flex-row items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/15 px-4 py-3">
              <Text className="text-foreground flex-1 font-mono text-base font-bold uppercase tracking-wider">
                {preview.code}
              </Text>
              <Button
                size="sm"
                className="flex-row gap-1.5 rounded-full"
                onPress={() => void copyCode()}>
                <Icon as={Copy} className="text-primary-foreground size-3.5" />
                <Text>Copy</Text>
              </Button>
            </View>

            {preview.description ? (
              <Text className="text-muted-foreground text-sm leading-relaxed">{preview.description}</Text>
            ) : null}

            {coupon?.eligibilitySummary ? (
              <Text className="text-foreground text-sm">{coupon.eligibilitySummary}</Text>
            ) : null}

            {preview.conditions.length > 0 ? (
              <View className="gap-2">
                {preview.conditions.map((item) => {
                  const CondIcon = CONDITION_ICONS[item.icon] ?? ShoppingBag;
                  return (
                    <View key={`${item.icon}-${item.label}`} className="flex-row items-center gap-2">
                      <Icon as={CondIcon} className="text-foreground/60 size-4 shrink-0" />
                      <Text className="text-muted-foreground text-sm">{item.label}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <Text className="text-muted-foreground text-xs">
              Apply this code at checkout after adding to your bag.
            </Text>
          </View>
        </ScrollView>
      ) : null}
    </HomeBottomSheetModal>
  );
}
