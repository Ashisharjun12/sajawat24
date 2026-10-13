import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Text } from '@/components/ui/text';
import { AccountSubScreen } from '@/module/account/components/AccountSubScreen';
import { PROFILE_FAQ_PLACEHOLDER } from '@/module/account/lib/profile-faq-placeholder';
import { View } from 'react-native';

export function FaqScreen() {
  return (
    <AccountSubScreen title="FAQ">
      <Text className="text-muted-foreground -mt-2 text-sm">
        Quick answers about bookings, customisation, and delivery in your city.
      </Text>

      <View className="mt-2">
        <Accordion type="single" collapsible>
          {PROFILE_FAQ_PLACEHOLDER.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>
                <Text className="text-foreground text-base font-medium">{item.question}</Text>
              </AccordionTrigger>
              <AccordionContent>
                <Text className="text-muted-foreground text-sm leading-6">{item.answer}</Text>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </View>
    </AccountSubScreen>
  );
}
