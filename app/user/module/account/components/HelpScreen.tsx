import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AccountSubScreen } from '@/module/account/components/AccountSubScreen';
import { HELP_TOPICS } from '@/module/chat/lib/help-topics';
import { type Href, router } from 'expo-router';
import { View } from 'react-native';

export function HelpScreen() {
  return (
    <AccountSubScreen title="Help & Support">
      <Text className="text-muted-foreground -mt-2 text-sm">
        Choose a topic below to start a chat with our support team.
      </Text>

      <View className="mt-4">
        <Accordion type="single" collapsible>
          {HELP_TOPICS.map((topic) => (
            <AccordionItem key={topic.topicKey} value={topic.topicKey}>
              <AccordionTrigger>
                <Text className="text-foreground text-base font-medium">{topic.title}</Text>
              </AccordionTrigger>
              <AccordionContent>
                <Text className="text-muted-foreground mb-4 text-sm leading-6">
                  {topic.description}
                </Text>
                <Button
                  size="sm"
                  className="self-start rounded-lg"
                  onPress={() =>
                    router.push(`/(app)/profile/help/${topic.topicKey}` as Href)
                  }>
                  <Text>Chat about this</Text>
                </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </View>
    </AccountSubScreen>
  );
}
