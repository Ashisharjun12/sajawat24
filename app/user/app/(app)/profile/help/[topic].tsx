import { LoadingPlaceholder, ScalePressable } from '@/components/shell';
import { useHideTabBarWhileMounted } from '@/lib/use-hide-tab-bar';
import { getHelpTopic } from '@/module/chat/lib/help-topics';
import { SupportTopicChatScreen } from '@/module/chat/components/SupportTopicChatScreen';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';
export default function HelpTopicChatRoute() {
  useHideTabBarWhileMounted();
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const topicKey = topic?.trim() ?? '';
  const helpTopic = getHelpTopic(topicKey);

  useEffect(() => {
    if (topicKey && !helpTopic) {
      router.replace('/(app)/profile/help' as Href);
    }
  }, [topicKey, helpTopic]);

  if (!topicKey) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <LoadingPlaceholder />
      </SafeAreaView>
    );
  }

  if (!helpTopic) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-muted-foreground text-center text-sm">Unknown help topic.</Text>
        <ScalePressable
          haptic
          className="mt-4"
          onPress={() => router.replace('/(app)/profile/help' as Href)}>
          <Text className="text-primary font-semibold">Back to Help</Text>
        </ScalePressable>
      </SafeAreaView>
    );
  }

  return (
    <SupportTopicChatScreen
      topicKey={helpTopic.topicKey}
      title={helpTopic.title}
      subtitle={helpTopic.description}
    />
  );
}
