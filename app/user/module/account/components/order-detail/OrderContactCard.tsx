import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { lightImpact } from '@/lib/light-haptic';
import type { PublicOrder } from '@/api/orders.api';
import {
  canChatWithVendor,
  getOrderContacts,
  shouldShowOrderContactCard,
} from '@/module/account/lib/order-contact';
import { openOrderBookingChat } from '@/module/chat/lib/open-order-booking-chat';
import { MessageCircle, Phone } from 'lucide-react-native';
import { Linking, View } from 'react-native';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ContactRow({
  name,
  subtitle,
  phone,
  onCall,
  onChat,
  showChat,
}: {
  name: string;
  subtitle: string;
  phone: string | null;
  onCall: () => void;
  onChat?: () => void;
  showChat?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="size-12 items-center justify-center rounded-full bg-primary">
        <Text className="text-primary-foreground text-sm font-bold">{initials(name)}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-muted-foreground text-sm" numberOfLines={2}>{subtitle}</Text>
      </View>
      <View className="flex-row gap-2">
        {showChat && onChat ? (
          <ScalePressable
            haptic
            onPress={onChat}
            className="size-10 items-center justify-center rounded-full border border-border bg-background">
            <Icon as={MessageCircle} className="text-foreground size-5" />
          </ScalePressable>
        ) : null}
        {phone ? (
          <ScalePressable
            haptic
            onPress={onCall}
            className="size-10 items-center justify-center rounded-full bg-primary">
            <Icon as={Phone} className="text-primary-foreground size-5" />
          </ScalePressable>
        ) : null}
      </View>
    </View>
  );
}

type Props = {
  order: PublicOrder;
};

export function OrderContactCard({ order }: Props) {
  if (!shouldShowOrderContactCard(order)) return null;

  const contacts = getOrderContacts(order);
  if (!contacts) return null;

  const chatEnabled = canChatWithVendor(order);

  function openChat() {
    lightImpact();
    openOrderBookingChat(order.id);
  }

  function callPhone(phone: string | null) {
    if (!phone?.trim()) return;
    lightImpact();
    void Linking.openURL(`tel:${phone.trim()}`);
  }

  return (
    <View className="rounded-2xl border border-border bg-card p-4 gap-4">
      <ContactRow
        {...contacts.primary}
        showChat={chatEnabled}
        onChat={chatEnabled ? openChat : undefined}
        onCall={() => callPhone(contacts.primary.phone)}
      />
      {contacts.vendorSupport ? (
        <View className="border-t border-border/60 pt-4">
          <ContactRow
            {...contacts.vendorSupport}
            onCall={() => callPhone(contacts.vendorSupport!.phone)}
          />
        </View>
      ) : null}
    </View>
  );
}
