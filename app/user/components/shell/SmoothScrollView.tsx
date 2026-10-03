import { smoothScrollViewProps } from '@/lib/scroll-config';
import { cn } from '@/lib/utils';
import { ScrollView, type ScrollViewProps } from 'react-native';

type SmoothScrollViewProps = ScrollViewProps & {
  className?: string;
  contentClassName?: string;
};

export function SmoothScrollView({
  className,
  contentClassName,
  ...props
}: SmoothScrollViewProps) {
  return (
    <ScrollView
      className={cn('flex-1', className)}
      contentContainerClassName={contentClassName}
      {...smoothScrollViewProps}
      {...props}
    />
  );
}
