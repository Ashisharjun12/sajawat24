import { getApiError } from '@/api/client';
import type { PublicOrder } from '@/api/orders.api';
import type { ChatMessage } from '@/api/chat.api';
import { LoadingPlaceholder, ScalePressable } from '@/components/shell';
import { AppSpinner } from '@/components/ui/app-spinner';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { lightImpact } from '@/lib/light-haptic';
import { useThemeColors } from '@/lib/theme';
import { ChatAttachmentBubble } from '@/module/chat/components/ChatAttachmentBubble';
import { ChatAttachmentSheet } from '@/module/chat/components/ChatAttachmentSheet';
import { ChatQuickReplyChips } from '@/module/chat/components/ChatQuickReplyChips';
import { MessageReceiptIcon } from '@/module/chat/components/MessageReceiptIcon';
import { TypingIndicator } from '@/module/chat/components/TypingIndicator';
import { useChatAttachment } from '@/module/chat/hooks/use-chat-attachment';
import { useBookingChatThread } from '@/module/chat/hooks/use-booking-chat-thread';
import { useConversationTyping } from '@/module/chat/hooks/use-conversation-typing';
import { BOOKING_CHAT_QUICK_REPLIES } from '@/module/chat/lib/booking-chat-quick-replies';
import { formatMessageTime } from '@/module/chat/lib/chat-utils';
import { getOrderContacts } from '@/module/account/lib/order-contact';
import { router } from 'expo-router';
import { ArrowLeft, MessageCircle, Phone, Plus, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  LayoutAnimation,
  Alert,
  Linking,
  Platform,
  Pressable,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type BookingChatScreenProps = {
  orderId: string;
  order: PublicOrder;
};

export function BookingChatScreen({ orderId, order }: BookingChatScreenProps) {
  const {
    conversation,
    messages,
    isLoading: chatLoading,
    sendMessage,
    isSending,
    error,
  } = useBookingChatThread(orderId);
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [draft, setDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { sendAttachment, isUploading } = useChatAttachment(conversation?.id);
  const canSend = draft.trim().length > 0 && !isSending && !isUploading;
  const { otherTyping } = useConversationTyping(conversation?.id, draft, 'customer');

  const contacts = getOrderContacts(order);
  const vendorParticipant = conversation?.participants?.find((p) => p.role === 'vendor');
  const vendorName = vendorParticipant?.name ?? contacts?.primary.name ?? 'Decorator';
  const vendorOnline = vendorParticipant?.isOnline ?? false;
  const callPhone = contacts?.primary.phone?.trim() ?? '';

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(
          LayoutAnimation.create(event.duration ?? 250, 'easeInEaseOut', 'opacity'),
        );
      }
      setKeyboardHeight(event.endCoordinates.height);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });

    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(
          LayoutAnimation.create(event?.duration ?? 250, 'easeInEaseOut', 'opacity'),
        );
      }
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (otherTyping) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [otherTyping]);

  async function sendText(text: string) {
    const body = text.trim();
    if (!body || isSending || isUploading) return;
    lightImpact();
    try {
      await sendMessage(body);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (err) {
      Alert.alert('Could not send message', getApiError(err));
      throw err;
    }
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    try {
      await sendText(text);
    } catch {
      setDraft(text);
    }
  }

  const visibleMessages = messages.filter((m) => m.messageType !== 'system');
  const isThreadEmpty = visibleMessages.length === 0;
  const composerBusy = isSending || isUploading;

  function handleCall() {
    if (!callPhone) return;
    lightImpact();
    void Linking.openURL(`tel:${callPhone}`);
  }

  const keyboardOffset = keyboardHeight > 0 ? Math.max(0, keyboardHeight - insets.bottom) : 0;

  if (error && !conversation) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted-foreground text-center text-sm">
            Could not open chat for this order.
          </Text>
          <ScalePressable haptic onPress={() => router.back()} className="mt-4">
            <Text className="text-primary text-sm font-semibold">Go back</Text>
          </ScalePressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center gap-3 border-b border-border px-4 pb-3 pt-2">
        <ScalePressable
          haptic
          onPress={() => router.back()}
          className="size-10 items-center justify-center"
          accessibilityLabel="Go back">
          <Icon as={ArrowLeft} className="text-foreground size-5" />
        </ScalePressable>
        <View className="min-w-0 flex-1">
          <Text className="text-foreground text-lg font-semibold" numberOfLines={1}>
            {vendorName}
          </Text>
          {vendorOnline ? (
            <Text className="text-muted-foreground text-xs">Online</Text>
          ) : (
            <Text className="text-muted-foreground text-xs">Order {order.reference}</Text>
          )}
        </View>
        {callPhone ? (
          <ScalePressable
            haptic
            onPress={handleCall}
            className="size-10 items-center justify-center"
            accessibilityLabel="Call decorator">
            <Icon as={Phone} className="text-foreground size-5" />
          </ScalePressable>
        ) : null}
      </View>

      <View className="flex-1" style={{ paddingBottom: keyboardOffset }}>
        {chatLoading ? (
          <View className="flex-1 items-center justify-center">
            <LoadingPlaceholder className="py-0" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerClassName="gap-3 px-5 py-4"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              isThreadEmpty ? (
                <View className="flex-1 items-center justify-center px-6 py-12">
                  <View className="mb-4 size-16 items-center justify-center rounded-full bg-primary-tint">
                    <Icon as={MessageCircle} className="text-primary size-9" />
                  </View>
                  <Text className="text-foreground text-center text-base font-semibold">
                    Chat with your decorator
                  </Text>
                  <Text className="text-muted-foreground mt-2 text-center text-sm leading-5">
                    Coordinate on the day of your booking — share updates or ask when they will
                    arrive.
                  </Text>
                </View>
              ) : null
            }
            ListFooterComponent={otherTyping ? <TypingIndicator align="left" /> : null}
            renderItem={({ item }) => {
              const isMine = item.senderRole === 'customer';
              const isSystem = item.messageType === 'system';
              const isAttachment =
                item.messageType === 'image' || item.messageType === 'file';

              return (
                <View className={`flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <View className="max-w-[85%]">
                    <View
                      className={`overflow-hidden rounded-2xl px-4 py-3 ${
                        isMine ? 'bg-primary' : 'bg-muted'
                      }`}>
                      {isAttachment ? (
                        <ChatAttachmentBubble message={item} isMine={isMine} />
                      ) : (
                        <Text
                          className={`text-sm leading-5 ${
                            isMine ? 'text-primary-foreground' : 'text-foreground'
                          }`}>
                          {item.body}
                        </Text>
                      )}
                      {item.body && isAttachment ? (
                        <Text
                          className={`mt-2 text-xs ${
                            isMine ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          }`}>
                          {item.body}
                        </Text>
                      ) : null}
                    </View>
                    {!isSystem ? (
                      <View
                        className={`mt-1 flex-row items-center gap-1 ${
                          isMine ? 'justify-end' : 'justify-start'
                        }`}>
                        <Text className="text-[10px] text-muted-foreground">
                          {formatMessageTime(item.createdAt)}
                        </Text>
                        {isMine && item.readStatus ? (
                          <MessageReceiptIcon status={item.readStatus} />
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            }}
          />
        )}

        <View
          className="border-t border-border bg-background px-4 pt-3"
          style={{ paddingBottom: keyboardHeight > 0 ? 8 : Math.max(insets.bottom, 12) }}>
          <ChatQuickReplyChips
            suggestions={BOOKING_CHAT_QUICK_REPLIES}
            disabled={composerBusy}
            onSelect={(text) => {
              void sendText(text);
            }}
          />
          <View className="mt-2 flex-row items-end gap-2">
            <View className="min-h-11 flex-1 flex-row items-end rounded-input border border-border bg-surface px-3 py-2">
              <TextInput
                className="max-h-24 flex-1 py-1.5 text-body font-normal text-foreground"
                placeholder="Message your decorator…"
                placeholderTextColor={theme.mutedForeground}
                value={draft}
                onChangeText={setDraft}
                onFocus={() => {
                  setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
                }}
                multiline
                textAlignVertical="center"
              />
              <Pressable
                onPress={() => {
                  if (isUploading) return;
                  Keyboard.dismiss();
                  setAttachOpen(true);
                }}
                hitSlop={8}
                className="mb-0.5 p-1.5"
                accessibilityLabel="Attach file">
                {isUploading ? (
                  <AppSpinner size="sm" />
                ) : (
                  <Icon as={Plus} size={22} className="text-foreground" />
                )}
              </Pressable>
            </View>

            {canSend ? (
              <ScalePressable
                haptic
                onPress={() => void handleSend()}
                className="mb-0.5 size-11 items-center justify-center rounded-pill bg-primary"
                accessibilityLabel="Send message">
                <Icon as={Send} size={18} className="text-primary-foreground" />
              </ScalePressable>
            ) : null}
          </View>
        </View>
      </View>

      <ChatAttachmentSheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        disabled={isUploading}
        onPick={(source) => {
          void sendAttachment(source).catch((err) => {
            Alert.alert('Could not send attachment', getApiError(err));
          });
        }}
      />
    </SafeAreaView>
  );
}
