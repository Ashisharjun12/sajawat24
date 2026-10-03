import { FadeInView, PressableScale } from '@/components/motion';
import { triggerHaptic } from '@/components/motion/haptics';
import { LoadingPlaceholder, Surface } from '@/components/shell';
import { AppSpinner } from '@/components/ui/app-spinner';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { VendorJobDetail } from '@/module/bookings/lib/booking.types';
import { ChatAttachmentBubble } from '@/module/chat/components/ChatAttachmentBubble';
import { ChatAttachmentSheet } from '@/module/chat/components/ChatAttachmentSheet';
import { useChatAttachment } from '@/module/chat/hooks/use-chat-attachment';
import { useVendorJob } from '@/module/bookings/hooks/use-vendor-jobs';
import { MessageReceiptIcon } from '@/module/chat/components/MessageReceiptIcon';
import { TypingIndicator } from '@/module/chat/components/TypingIndicator';
import { useConversationTyping } from '@/module/chat/hooks/use-conversation-typing';
import { useBookingChatThread } from '@/module/chat/hooks/use-chat-thread';
import { formatMessageTime } from '@/module/chat/lib/chat-utils';
import type { ChatMessage } from '@/api/chat.api';
import * as Haptics from 'expo-haptics';
import { Href, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Phone, Plus, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  LayoutAnimation,
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

export default function BookingChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = String(id ?? '');
  const { data: job, isLoading: jobLoading, isError: jobError } = useVendorJob(orderId);

  useEffect(() => {
    if (jobLoading || !job) return;
    if (!job.canChat) {
      router.replace(`/(app)/bookings/${orderId}` as Href);
    }
  }, [job, jobLoading, orderId]);

  if (jobLoading || (job && !job.canChat)) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <LoadingPlaceholder className="py-0" />
        </View>
      </SafeAreaView>
    );
  }

  if (jobError || !job) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted-foreground text-center text-sm">
            Could not open chat for this booking.
          </Text>
          <PressableScale onPress={() => router.back()} className="mt-4">
            <Text className="text-primary text-sm font-semibold">Go back</Text>
          </PressableScale>
        </View>
      </SafeAreaView>
    );
  }

  return <BookingChatContent orderId={orderId} job={job} />;
}

function BookingChatContent({ orderId, job }: { orderId: string; job: VendorJobDetail }) {
  const {
    conversation,
    messages,
    isLoading: chatLoading,
    sendMessage,
    isSending,
  } = useBookingChatThread(orderId);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [draft, setDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { sendAttachment, isUploading } = useChatAttachment(conversation?.id);
  const canSend = draft.trim().length > 0 && !isSending && !isUploading;
  const { otherTyping } = useConversationTyping(conversation?.id, draft, 'vendor');

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimation.create(event.duration ?? 250, 'easeInEaseOut', 'opacity'));
      }
      setKeyboardHeight(event.endCoordinates.height);
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 50);
    });

    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimation.create(event?.duration ?? 250, 'easeInEaseOut', 'opacity'));
      }
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  async function handleSend() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    try {
      await sendMessage(text);
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 50);
    } catch {
      setDraft(text);
    }
  }

  const keyboardOffset =
    keyboardHeight > 0 ? Math.max(0, keyboardHeight - insets.bottom) : 0;
  const isLoading = chatLoading;
  const customerOnline =
    conversation?.participants?.find((p) => p.role === 'customer')?.isOnline ?? false;
  const customerPhone = job.customer.phone?.trim() ?? '';

  function handleCallCustomer() {
    if (!customerPhone) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL(`tel:${customerPhone}`);
  }

  useEffect(() => {
    if (otherTyping) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [otherTyping]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center gap-3 border-b border-border px-4 pb-3 pt-4">
        <PressableScale
          onPress={() => router.back()}
          className="size-10 items-center justify-center"
          accessibilityLabel="Go back">
          <Icon as={ArrowLeft} className="text-foreground size-5" />
        </PressableScale>
        <View className="min-w-0 flex-1">
          <Text className="text-foreground text-lg font-semibold" numberOfLines={1}>
            {job.customer.name}
          </Text>
          {customerOnline ? (
            <Text className="text-muted-foreground text-xs">Online</Text>
          ) : null}
        </View>
        {customerPhone ? (
          <PressableScale
            onPress={handleCallCustomer}
            className="size-10 items-center justify-center"
            accessibilityLabel="Call customer"
            scaleTo={0.92}>
            <Icon as={Phone} className="text-foreground size-5" />
          </PressableScale>
        ) : null}
      </View>

      <View className="flex-1" style={{ paddingBottom: keyboardOffset }}>
        {isLoading ? (
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
            ListFooterComponent={
              otherTyping ? <TypingIndicator align="left" /> : null
            }
            renderItem={({ item, index }) => {
              const isVendor = item.senderRole === 'vendor';
              const isSystem = item.messageType === 'system';
              return (
                <FadeInView delay={Math.min(index * 20, 120)}>
                  <View className={`flex-row ${isVendor ? 'justify-end' : 'justify-start'}`}>
                    <View className="max-w-[85%]">
                      <Surface
                        className={`px-4 py-3 ${isVendor ? 'bg-primary' : 'bg-muted'}`}>
                        {item.messageType === 'image' || item.messageType === 'file' ? (
                          <ChatAttachmentBubble message={item} isVendor={isVendor} />
                        ) : (
                          <Text
                            className={`text-sm leading-5 ${isVendor ? 'text-primary-foreground' : 'text-foreground'}`}>
                            {item.body}
                          </Text>
                        )}
                        {item.body && item.messageType !== 'text' ? (
                          <Text
                            className={`mt-2 text-xs ${isVendor ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {item.body}
                          </Text>
                        ) : null}
                      </Surface>
                      {!isSystem ? (
                        <View
                          className={`mt-1 flex-row items-center gap-1 ${isVendor ? 'justify-end' : 'justify-start'}`}>
                          <Text className="text-[10px] text-muted-foreground">
                            {formatMessageTime(item.createdAt)}
                          </Text>
                          {isVendor && item.readStatus ? (
                            <MessageReceiptIcon status={item.readStatus} />
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  </View>
                </FadeInView>
              );
            }}
          />
        )}

        <View
          className="border-t border-border bg-background px-4 pt-3"
          style={{ paddingBottom: keyboardHeight > 0 ? 8 : Math.max(insets.bottom, 12) }}>
          <View className="flex-row items-end gap-2">
            <View className="min-h-11 flex-1 flex-row items-end rounded-2xl border border-border bg-background px-3 py-2">
              <TextInput
                className="max-h-24 flex-1 py-1.5 text-base text-foreground"
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                value={draft}
                onChangeText={setDraft}
                onFocus={() => {
                  setTimeout(() => {
                    listRef.current?.scrollToEnd({ animated: true });
                  }, 100);
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
                  <AppSpinner size="sm" variant="inverse" />
                ) : (
                  <Plus size={22} color="#111827" />
                )}
              </Pressable>
            </View>

            {canSend ? (
              <PressableScale
                onPress={handleSend}
                className="mb-0.5 size-11 items-center justify-center rounded-full bg-primary"
                accessibilityLabel="Send message">
                <Send size={18} color="#FFFFFF" />
              </PressableScale>
            ) : null}
          </View>
        </View>
      </View>

      <ChatAttachmentSheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        disabled={isUploading}
        onPick={(source) => {
          void sendAttachment(source).catch(() => {});
        }}
      />
    </SafeAreaView>
  );
}
