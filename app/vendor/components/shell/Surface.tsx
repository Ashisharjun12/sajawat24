import { cn } from '@/lib/utils';
import { View, type ViewProps } from 'react-native';

type SurfaceProps = ViewProps & {
  className?: string;
  accent?: boolean;
};

export function Surface({ className, accent, children, ...props }: SurfaceProps) {
  return (
    <View
      className={cn(
        'overflow-hidden rounded-3xl bg-card shadow-soft',
        accent && 'border-l-4 border-l-primary',
        className,
      )}
      {...props}>
      {children}
    </View>
  );
}

export function SoftSection({ className, children, ...props }: ViewProps & { className?: string }) {
  return (
    <View className={cn('rounded-3xl bg-muted/70 p-4', className)} {...props}>
      {children}
    </View>
  );
}
