import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { RejectedApplicationSteps } from '@/module/application-review/components/RejectedApplicationSteps';
import { PENDING_REVIEW_IMAGE } from '@/module/application-review/lib/review-copy';
import { Image } from 'expo-image';
import { RefreshControl, ScrollView, View } from 'react-native';

type RejectedApplicationContentProps = {
  refreshing: boolean;
  signingOut: boolean;
  onRefresh: () => void;
  onReapply: () => void;
  onSignOut: () => void;
};

export function RejectedApplicationContent({
  refreshing,
  signingOut,
  onRefresh,
  onReapply,
  onSignOut,
}: RejectedApplicationContentProps) {
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
            accessibilityLabel="Application not approved"
            contentFit="contain"
            style={{ width: '100%', height: 180, maxWidth: 260 }}
          />
        </View>

        <View className="mb-8 gap-3">
          <Text className="text-foreground" style={{ fontSize: 32, lineHeight: 38, fontWeight: '700' }}>
            Application not approved
          </Text>
          <Text className="text-muted-foreground text-base leading-6">
            Your application was not approved. Please review your shop details and reapply so our
            team can take another look.
          </Text>
        </View>

        <View className="mb-8">
          <Text className="text-foreground mb-4 text-sm font-semibold uppercase tracking-wide">
            What happens next
          </Text>
          <RejectedApplicationSteps />
        </View>

        <View className="bg-muted/60 border-border rounded-2xl border px-4 py-4">
          <Text className="text-muted-foreground text-center text-sm leading-5">
            Update any incorrect details before reapplying. Pull down to refresh if your status
            changes.
          </Text>
        </View>
      </ScrollView>

      <View className="border-border gap-3 border-t px-8 pb-10 pt-4">
        <Button className="h-12 rounded-2xl" onPress={onReapply}>
          <Text>Reapply now</Text>
        </Button>
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
