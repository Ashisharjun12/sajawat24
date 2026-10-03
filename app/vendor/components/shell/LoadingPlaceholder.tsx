import { AppSpinner } from '@/components/ui/app-spinner';
import { cn } from '@/lib/utils';
import { View } from 'react-native';

type LoadingPlaceholderProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

export function LoadingPlaceholder({ className, size = 'md' }: LoadingPlaceholderProps) {
  return (
    <View className={cn('items-center justify-center py-8', className)}>
      <AppSpinner size={size} />
    </View>
  );
}
