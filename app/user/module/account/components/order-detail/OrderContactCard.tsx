import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { lightImpact } from '@/lib/light-haptic';
import { cn } from '@/lib/utils';
import type { PublicOrder } from '@/api/orders.api';
import {
  canChatWithVendor,
  getOrderContacts,
  shouldShowOrderContactCard,
  type OrderContactRow,
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

/** Neutral grey avatar with initials (no brand colour, keeps the card calm). */
function Avatar({ name, size = 'lg' }: { name: string; size?: 'lg' | 'sm' }) {
  return (
    <View
      className={cn(
        'items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700',
        size === 'lg' ? 'size-12' : 'size-9',
      )}>
      <Text
        className={cn(
          'font-semibold text-zinc-700 dark:text-zinc-100',
          size === 'lg' ? 'text-sm' : 'text-xs',
        )}>
        {initials(name)}
      </Text>
    </View>
  );
}

/** Full-width action button. `solid` = dark (Call), otherwise white on the grey card (Chat). */
function ActionButton({
  label,
  icon,
  solid = false,
  onPress,
}: {
  label: string;
  icon: typeof Phone;
  solid?: boolean;
  onPress: () => void;
}) {
  return (
    <ScalePressable
      haptic
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(
        'h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl',
        solid ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-white dark:bg-zinc-900',
      )}>
      <Icon
        as={icon}
        className={cn('size-[18px]', solid ? 'text-white dark:text-zinc-900' : 'text-foreground')}
      />
      <Text
        className={cn(
          'text-sm font-semibold',
          solid ? 'text-white dark:text-zinc-900' : 'text-foreground',
        )}>
        {label}
      </Text>
    </ScalePressable>
  );
}

/** Secondary contact (vendor support): compact row with a small round call button. */
function SupportRow({ contact, onCall }: { contact: OrderContactRow; onCall: () => void }) {
  return (
    <View className="flex-row items-center gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
      <Avatar name={contact.name} size="sm" />
      <View className="min-w-0 flex-1">
        <Text className="text-muted-foreground text-xs">{contact.role}</Text>
        <Text className="text-foreground text-sm font-medium" numberOfLines={1}>
          {contact.name}
        </Text>
      </View>
      {contact.phone ? (
        <ScalePressable
          haptic
          onPress={onCall}
          accessibilityRole="button"
          accessibilityLabel={`${contact.callLabel}, ${contact.name}`}
          className="size-9 items-center justify-center rounded-full bg-white dark:bg-zinc-900">
          <Icon as={Phone} className="text-foreground size-4" />
        </ScalePressable>
      ) : null}
    </View>
  );
}

type Props = {
  order: PublicOrder;
};

/**
 * Decorator contact on order detail. Minimal grey card: small role label, avatar + full name
 * (2 lines, never cut short by buttons), shop name, then wide Chat / Call buttons underneath.
 */
export function OrderContactCard({ order }: Props) {
  if (!shouldShowOrderContactCard(order)) return null;

  const contacts = getOrderContacts(order);
  if (!contacts) return null;

  const { primary, vendorSupport } = contacts;
  const chatEnabled = canChatWithVendor(order);
  const canCall = Boolean(primary.phone?.trim());

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
    <View className="gap-3 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800/70">
      <Text className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
        {primary.role}
      </Text>

      <View className="flex-row items-center gap-3">
        <Avatar name={primary.name} />
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-foreground text-base font-semibold" numberOfLines={2}>
            {primary.name}
          </Text>
          {primary.detail ? (
            <Text className="text-muted-foreground text-sm" numberOfLines={1}>
              {primary.detail}
            </Text>
          ) : null}
        </View>
      </View>

      {chatEnabled || canCall ? (
        <View className="flex-row gap-2">
          {chatEnabled ? (
            <ActionButton label="Chat" icon={MessageCircle} onPress={openChat} />
          ) : null}
          {canCall ? (
            <ActionButton
              label="Call"
              icon={Phone}
              solid
              onPress={() => callPhone(primary.phone)}
            />
          ) : null}
        </View>
      ) : null}

      {vendorSupport ? (
        <SupportRow contact={vendorSupport} onCall={() => callPhone(vendorSupport.phone)} />
      ) : null}
    </View>
  );
}
