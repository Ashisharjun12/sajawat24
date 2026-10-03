import { FadeInView, PressableScale } from '@/components/motion';
import { triggerHaptic } from '@/components/motion/haptics';
import { LoadingPlaceholder, Surface } from '@/components/shell';
import { AppSpinner } from '@/components/ui/app-spinner';
import { Text } from '@/components/ui/text';
import { useSupportChatThread } from '@/module/chat/hooks/use-chat-thread';
import { ChatAttachmentBubble } from '@/module/chat/components/ChatAttachmentBubble';
import { ChatAttachmentSheet } from '@/module/chat/components/ChatAttachmentSheet';
import { MessageReceiptIcon } from '@/module/chat/components/MessageReceiptIcon';
import { TypingIndicator } from '@/module/chat/components/TypingIndicator';
import { useChatAttachment } from '@/module/chat/hooks/use-chat-attachment';
import { useConversationTyping } from '@/module/chat/hooks/use-conversation-typing';
import { formatMessageTime } from '@/module/chat/lib/chat-utils';
import type { ChatMessage } from '@/api/chat.api';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Plus, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SupportChatScreen() {
  const { conversation, messages, isLoading, error, sendMessage, isSending } =
    useSupportChatThread();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [draft, setDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { sendAttachment, isUploading } = useChatAttachment(conversation?.id);
  const { otherTyping } = useConversationTyping(conversation?.id, draft, 'vendor');
  const canSend =
    Boolean(conversation?.id) &&
    draft.trim().length > 0 &&
    !isSending &&
    !isUploading &&
    !isLoading;

  const supportOnline =
    conversation?.participants?.find((p) => p.role === 'admin')?.isOnline ?? false;

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
    if (!text || !conversation?.id) return;
    setDraft('');
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    try {
      await sendMessage(text);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch {
      setDraft(text);
    }
  }

  const keyboardOffset =
    keyboardHeight > 0 ? Math.max(0, keyboardHeight - insets.bottom) : 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="border-b border-border px-5 pb-3 pt-2">
        <PressableScale onPress={() => router.back()} className="mb-2 self-start">
          <Text className="text-foreground text-sm font-medium">Back</Text>
        </PressableScale>
        <Text className="text-foreground text-xl font-semibold">Support chat</Text>
        <Text className="text-muted-foreground mt-0.5 text-sm">Message the Decoryy team</Text>
        {supportOnline ? (
          <Text className="text-muted-foreground mt-1 text-xs">Support is online</Text>
        ) : null}
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted-foreground text-center text-sm">
            Could not open support chat. Check your connection and try again.
          </Text>
        </View>
      ) : (
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
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-12">
                  <Text className="text-muted-foreground text-center text-sm">
                    Say hello — our team will reply here.
                  </Text>
                </View>
              }
              ListFooterComponent={otherTyping ? <TypingIndicator align="left" /> : null}
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
                    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
                  }}
                  multiline
                  textAlignVertical="center"
                  editable={!isLoading && Boolean(conversation?.id)}
                />
                <Pressable
                  onPress={() => {
                    if (isUploading || !conversation?.id) return;
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
      )}

      <ChatAttachmentSheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        disabled={isUploading}
        onPick={(source) => {
          void sendAttachment(source)
            .then(() => {
              setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
            })
            .catch(() => {});
        }}
      />
    </SafeAreaView>
  );
}
