import { ApplicationReviewSkeleton } from '@/module/application-review/components/ApplicationReviewSkeleton';
import { PendingReviewContent } from '@/module/application-review/components/PendingReviewContent';
import { usePendingReview } from '@/module/application-review/hooks/use-pending-review';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PendingScreen() {
  const { isLoading, refreshing, handleRefresh } = usePendingReview();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {isLoading ? (
        <ApplicationReviewSkeleton />
      ) : (
        <PendingReviewContent refreshing={refreshing} onRefresh={handleRefresh} />
      )}
    </SafeAreaView>
  );
}
