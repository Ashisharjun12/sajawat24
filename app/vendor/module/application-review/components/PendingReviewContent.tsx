import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApplicationReviewSteps } from '@/module/application-review/components/ApplicationReviewSteps';
import { PENDING_REVIEW_IMAGE } from '@/module/application-review/lib/review-copy';
import { Image } from 'expo-image';
import { RefreshControl, ScrollView, View } from 'react-native';

type PendingReviewContentProps = {
  refreshing: boolean;
  onRefresh: () => void;
};

export function PendingReviewContent({ refreshing, onRefresh }: PendingReviewContentProps) {
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
            accessibilityLabel="Application under review"
            contentFit="contain"
            style={{ width: '100%', height: 180, maxWidth: 260 }}
          />
        </View>

        <View className="mb-8 gap-3">
          <Text className="text-foreground" style={{ fontSize: 32, lineHeight: 38, fontWeight: '700' }}>
            Application under review
          </Text>
          <Text className="text-muted-foreground text-base leading-6">
            Thanks for joining Decoryy. We&apos;re reviewing your shop details and will notify you
            once your vendor profile is approved.
          </Text>
        </View>

        <View className="mb-8">
          <Text className="text-foreground mb-4 text-sm font-semibold uppercase tracking-wide">
            What happens next
          </Text>
          <ApplicationReviewSteps />
        </View>

        <View className="bg-muted/60 border-border rounded-2xl border px-4 py-4">
          <Text className="text-muted-foreground text-center text-sm leading-5">
            Reviews usually take 1–2 business days. Pull down to refresh once your account is approved.
          </Text>
        </View>
      </ScrollView>

      <View className="border-border border-t px-8 pb-10 pt-4">
        <Button variant="outline" className="h-12 rounded-2xl" onPress={onRefresh}>
          <Text>{refreshing ? 'Checking…' : 'Check approval status'}</Text>
        </Button>
      </View>
    </View>
  );
}
