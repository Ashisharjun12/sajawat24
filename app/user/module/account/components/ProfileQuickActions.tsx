import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { WhatsAppIcon } from '@/components/shell/WhatsAppIcon';
import { openWhatsAppSupport } from '@/lib/support-actions';
import { Href, router } from 'expo-router';
import { Heart, MapPin, Package } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

function QuickTile({
  label,
  icon,
  iconSlot,
  onPress,
}: {
  label: string;
  icon?: LucideIcon;
  iconSlot?: ReactNode;
  onPress: () => void;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      haptic
      className="min-h-14 flex-1 flex-row items-center gap-3 rounded-btn border border-border bg-card px-3.5 py-3"
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View className="size-9 items-center justify-center rounded-btn bg-primary-tint">
        {iconSlot ?? (icon ? <Icon as={icon} className="text-primary size-[18px]" /> : null)}
      </View>
      <Text className="text-foreground min-w-0 flex-1 text-sm font-medium" numberOfLines={1}>
        {label}
      </Text>
    </ScalePressable>
  );
}

/** 2 × 2 shortcut grid under the account card: orders, wishlist, chat, addresses. */
export function ProfileQuickActions() {
  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <QuickTile
          label="My orders"
          icon={Package}
          onPress={() => router.push('/(app)/profile/orders' as Href)}
        />
        <QuickTile
          label="Wishlist"
          icon={Heart}
          onPress={() => router.push('/(app)/wishlist' as Href)}
        />
      </View>
      <View className="flex-row gap-3">
        <QuickTile
          label="Chat with us"
          iconSlot={<WhatsAppIcon size={18} color="#25D366" />}
          onPress={() => void openWhatsAppSupport()}
        />
        <QuickTile
          label="Addresses"
          icon={MapPin}
          onPress={() => router.push('/(app)/profile/addresses' as Href)}
        />
      </View>
    </View>
  );
}
