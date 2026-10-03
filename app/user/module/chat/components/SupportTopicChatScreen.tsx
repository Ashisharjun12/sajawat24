import { getApiError } from '@/api/client';
import type { ChatMessage } from '@/api/chat.api';
import { LoadingPlaceholder, ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { lightImpact } from '@/lib/light-haptic';
import { ChatAttachmentBubble } from '@/module/chat/components/ChatAttachmentBubble';
import { ChatAttachmentSheet } from '@/module/chat/components/ChatAttachmentSheet';
import { MessageReceiptIcon } from '@/module/chat/components/MessageReceiptIcon';
import { TypingIndicator } from '@/module/chat/components/TypingIndicator';
import { useChatAttachment } from '@/module/chat/hooks/use-chat-attachment';
import { useConversationTyping } from '@/module/chat/hooks/use-conversation-typing';
import { useSupportTopicChatThread } from '@/module/chat/hooks/use-support-topic-chat-thread';
import { formatMessageTime } from '@/module/chat/lib/chat-utils';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSpinner } from '@/components/ui/app-spinner';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SupportTopicChatScreenProps = {
  topicKey: string;
  title: string;
  subtitle?: string;
};

export function SupportTopicChatScreen({
  topicKey,
  title,
  subtitle,
}: SupportTopicChatScreenProps) {
  const {
    conversation,
    messages,
    isLoading: chatLoading,
    sendMessage,
    isSending,
    error,
  } = useSupportTopicChatThread(topicKey, title);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [draft, setDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { sendAttachment, isUploading } = useChatAttachment(conversation?.id);
  const canSend = draft.trim().length > 0 && !isSending && !isUploading;
  const { otherTyping } = useConversationTyping(conversation?.id, draft, 'customer');

  const supportName =
    conversation?.chatPeer?.name ?? conversation?.participants?.find((p) => p.role !== 'customer')?.name ?? 'Support';

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

  async function handleSend() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    lightImpact();
    try {
      await sendMessage(text);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (err) {
      setDraft(text);
      Alert.alert('Could not send message', getApiError(err));
    }
  }

  const keyboardOffset = keyboardHeight > 0 ? Math.max(0, keyboardHeight - insets.bottom) : 0;

  if (error && !conversation) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted-foreground text-center text-sm">
            Could not open support chat. Try again later.
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
            {title}
          </Text>
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {subtitle ?? supportName}
          </Text>
        </View>
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
          <View className="flex-row items-end gap-2">
            <View className="min-h-11 flex-1 flex-row items-end rounded-2xl border border-border bg-background px-3 py-2">
              <TextInput
                className="max-h-24 flex-1 py-1.5 text-base text-foreground"
                placeholder="Tell us how we can help…"
                placeholderTextColor="#9CA3AF"
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
                  <AppSpinner size="sm" variant="inverse" />
                ) : (
                  <Plus size={22} color="#111827" />
                )}
              </Pressable>
            </View>

            {canSend ? (
              <ScalePressable
                haptic
                onPress={() => void handleSend()}
                className="mb-0.5 size-11 items-center justify-center rounded-full bg-primary"
                accessibilityLabel="Send message">
                <Send size={18} color="#FFFFFF" />
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
