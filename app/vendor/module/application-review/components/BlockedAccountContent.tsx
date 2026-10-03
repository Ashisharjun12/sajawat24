import { Button } from '@/components/ui/button';
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
import { PENDING_REVIEW_IMAGE } from '@/module/application-review/lib/review-copy';
import { Image } from 'expo-image';
import { MessageCircle, Mail, Phone } from 'lucide-react-native';
import { RefreshControl, ScrollView, View } from 'react-native';

type BlockedAccountContentProps = {
  refreshing: boolean;
  signingOut: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
};

export function BlockedAccountContent({
  refreshing,
  signingOut,
  onRefresh,
  onSignOut,
}: BlockedAccountContentProps) {
  const { brand, loading: brandLoading } = useSiteBrand();

  const phone = brand?.contactPhone?.trim() ?? '';
  const email = brand?.contactEmail?.trim() ?? '';
  const whatsapp = brand?.whatsappUrl?.trim() ?? '';

  async function copyValue(label: string, value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    await Clipboard.setStringAsync(trimmed);
    showCopiedAlert(label, trimmed);
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-8 pb-6 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className="mb-6 items-center">
          <Text className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">
            Decoryy Vendor
          </Text>
        </View>

        <View className="mb-6 items-center">
          <Image
            source={{ uri: PENDING_REVIEW_IMAGE }}
            accessibilityLabel="Account paused"
            contentFit="contain"
            style={{ width: '100%', height: 180, maxWidth: 260 }}
          />
        </View>

        <View className="mb-8 gap-3">
          <Text className="text-foreground" style={{ fontSize: 32, lineHeight: 38, fontWeight: '700' }}>
            Account paused
          </Text>
          <Text className="text-muted-foreground text-base leading-6">
            Your access to the Decoryy partner platform has been paused. You cannot receive bookings
            or use partner features until our team restores your account.
          </Text>
          <Text className="text-muted-foreground text-base leading-6">
            Please contact us if you think this is a mistake.
          </Text>
        </View>

        <View className="bg-card border-border mb-8 overflow-hidden rounded-2xl border px-4">
          <Text className="text-foreground border-border border-b py-3 text-sm font-semibold">
            Contact support
          </Text>
          <HelpContactCard
            icon={Phone}
            title="Call"
            value={phone}
            disabled={brandLoading || !phone}
            onPress={() => void openPhoneCall(phone)}
            onCopy={() => void copyValue('Phone', phone)}
          />
          <HelpContactCard
            icon={Mail}
            title="Email"
            value={email}
            disabled={brandLoading || !email}
            onPress={() => void openEmailCompose(email)}
            onCopy={() => void copyValue('Email', email)}
          />
          <HelpContactCard
            icon={MessageCircle}
            title="WhatsApp"
            value={whatsapp ? 'Message on WhatsApp' : undefined}
            disabled={brandLoading || !whatsapp}
            onPress={() => void openExternalUrl(whatsapp)}
          />
        </View>

        <View className="bg-muted/60 border-border rounded-2xl border px-4 py-4">
          <Text className="text-muted-foreground text-center text-sm leading-5">
            Pull down to refresh if your status was updated. Sign out to use a different account.
          </Text>
        </View>
      </ScrollView>

      <View className="border-border border-t px-8 pb-10 pt-4">
        <Button
          variant="destructive"
          className="h-12 rounded-2xl"
          disabled={signingOut}
          onPress={onSignOut}>
          <Text>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
        </Button>
      </View>
    </View>
  );
}
