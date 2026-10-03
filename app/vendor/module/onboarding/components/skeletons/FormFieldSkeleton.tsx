import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { View } from 'react-native';

type FormFieldSkeletonProps = {
  labelWidthClassName?: string;
  fieldClassName?: string;
  showLabel?: boolean;
};

export function FormFieldSkeleton({
  labelWidthClassName = 'w-20',
  fieldClassName = 'h-12 rounded-xl',
  showLabel = true,
}: FormFieldSkeletonProps) {
  return (
    <View className="gap-2">
      {showLabel ? <Skeleton className={cn('h-4', labelWidthClassName)} /> : null}
      <Skeleton className={cn('w-full', fieldClassName)} />
    </View>
  );
}
