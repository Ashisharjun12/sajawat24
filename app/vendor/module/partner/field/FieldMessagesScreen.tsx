import { Screen, ScreenHeader, LoadingPlaceholder } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { listConversations, type Conversation } from '@/api/chat.api';
import { useScreenRefresh } from '@/hooks/use-screen-refresh';
import { useQuery } from '@tanstack/react-query';
import { Href, router } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';

function ConversationRow({ item }: { item: Conversation }) {
  const orderId = item.contextType === 'order' ? item.contextId : null;
  const title = item.orderRef ? `Order ${item.orderRef}` : item.subject ?? 'Booking chat';
  const preview = item.lastMessagePreview ?? 'No messages yet';

  function open() {
    if (orderId) {
      router.push(`/(app)/bookings/${orderId}/chat` as Href);
      return;
    }
    if (item.type === 'vendor_support') {
      router.push('/(app)/support' as Href);
    }
  }

  return (
    <Pressable
      onPress={open}
      className="flex-row items-center justify-between border-b border-border py-4">
      <View className="min-w-0 flex-1 pr-3">
        <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-muted-foreground mt-1 text-sm" numberOfLines={2}>
          {preview}
        </Text>
      </View>
      {item.unreadCount > 0 ? (
        <View className="bg-primary min-w-6 rounded-full px-2 py-0.5">
          <Text className="text-primary-foreground text-center text-xs font-semibold">
            {item.unreadCount > 9 ? '9+' : item.unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function FieldMessagesScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['chat', 'conversations', 'booking'],
    queryFn: () =>
      listConversations({ type: 'booking', page: 1, limit: 50, status: 'all' }),
  });

  const refetchAll = useCallback(() => refetch(), [refetch]);
  const { refreshControl } = useScreenRefresh(refetchAll);

  const items = (data?.items ?? []).filter((c) => c.status !== 'closed');

  return (
    <Screen scrollProps={{ refreshControl }}>
      <ScreenHeader title="Messages" subtitle="Customer chats" />
      {isLoading ? (
        <LoadingPlaceholder />
      ) : isError ? (
        <Pressable onPress={() => void refetch()}>
          <Text className="text-destructive mt-4 text-sm">Could not load. Tap to retry.</Text>
        </Pressable>
      ) : items.length === 0 ? (
        <Text className="text-muted-foreground mt-6 text-center text-sm leading-5">
          No active chats. Messages appear when you are assigned to a job and the customer writes
          in.
        </Text>
      ) : (
        <View className="mt-2">
          {items.map((item) => (
            <ConversationRow key={item.id} item={item} />
          ))}
        </View>
      )}
    </Screen>
  );
}
