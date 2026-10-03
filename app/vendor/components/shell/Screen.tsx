import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  contentClassName?: string;
  scrollProps?: Omit<ScrollViewProps, 'children'>;
};

export function Screen({
  children,
  scroll = true,
  className,
  contentClassName,
  scrollProps,
}: ScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView className={cn('flex-1 bg-background', className)} edges={['top']}>
        <View className={cn('flex-1 px-5', contentClassName)}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={cn('flex-1 bg-background', className)} edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName={cn('gap-5 px-5 pb-8 pt-4', contentClassName)}
        showsVerticalScrollIndicator={false}
        {...scrollProps}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
