import { PressableScale } from '@/components/motion';
import { LoadingPlaceholder, Screen, Surface } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { HelpContactCard } from '@/module/support/components/HelpContactCard';
import { useSiteBrand } from '@/module/support/hooks/use-site-brand';
import {
  openEmailCompose,
  openExternalUrl,
  openPhoneCall,
  showCopiedAlert,
} from '@/module/support/lib/contact-actions';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Headphones, Mail, MessageCircle, Phone } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

function RowDivider() {
  return <View className="h-px bg-border/40" />;
}

export default function HelpSupportScreen() {
  const { brand, isLoading } = useSiteBrand();

  async function copyValue(label: string, value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    await Clipboard.setStringAsync(trimmed);
    showCopiedAlert(label, trimmed);
  }

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-10 pt-2"
        showsVerticalScrollIndicator={false}>
        <View>
          <PressableScale onPress={() => router.back()} className="mb-3 self-start">
            <Text className="text-foreground text-sm font-medium">Back</Text>
          </PressableScale>
          <Text className="text-foreground text-2xl font-bold">Help & support</Text>
        </View>

        {isLoading ? (
          <LoadingPlaceholder className="py-8" />
        ) : (
          <Surface className="px-4 py-1">
            <HelpContactCard
              icon={Phone}
              title="Call"
              value={brand.contactPhone ?? undefined}
              disabled={!brand.contactPhone}
              onPress={() => {
                if (brand.contactPhone) void openPhoneCall(brand.contactPhone);
              }}
              onCopy={
                brand.contactPhone
                  ? () => void copyValue('Phone', brand.contactPhone!)
                  : undefined
              }
            />
            <RowDivider />
            <HelpContactCard
              icon={Mail}
              title="Email"
              value={brand.contactEmail ?? undefined}
              disabled={!brand.contactEmail}
              onPress={() => {
                if (brand.contactEmail) void openEmailCompose(brand.contactEmail);
              }}
              onCopy={
                brand.contactEmail
                  ? () => void copyValue('Email', brand.contactEmail!)
                  : undefined
              }
            />
            <RowDivider />
            <HelpContactCard
              icon={MessageCircle}
              title="WhatsApp"
              value={brand.whatsappUrl ? 'Open chat' : undefined}
              disabled={!brand.whatsappUrl}
              onPress={() => {
                if (brand.whatsappUrl) void openExternalUrl(brand.whatsappUrl);
              }}
              onCopy={
                brand.whatsappUrl
                  ? () => void copyValue('Link', brand.whatsappUrl!)
                  : undefined
              }
            />
            <RowDivider />
            <HelpContactCard
              icon={Headphones}
              title="Chat with us"
              onPress={() => router.push('/(app)/support')}
            />
          </Surface>
        )}
      </ScrollView>
    </Screen>
  );
}
