import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';

type CouponTicketListSkeletonProps = {
  count?: number;
  variant?: 'ticket' | 'minimal';
};

export function CouponTicketListSkeleton({
  count = 3,
  variant = 'ticket',
}: CouponTicketListSkeletonProps) {
  const height = variant === 'minimal' ? 88 : 148;
  return (
    <View className="gap-3">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="w-full rounded-xl" style={{ height }} />
      ))}
    </View>
  );
}
