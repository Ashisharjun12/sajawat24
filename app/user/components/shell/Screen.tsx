import { SCREEN_HORIZONTAL_GUTTER } from '@/lib/theme';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  contentClassName?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Adds standard side inset (`SCREEN_HORIZONTAL_GUTTER`) inside safe area. */
  gutter?: boolean;
  scrollProps?: Omit<ScrollViewProps, 'children'>;
};

export function Screen({
  children,
  scroll = true,
  className,
  contentClassName,
  edges = ['top'],
  gutter = false,
  scrollProps,
}: ScreenProps) {
  const { contentContainerStyle: scrollContentStyle, ...restScrollProps } = scrollProps ?? {};
  const insets = useSafeAreaInsets();
  const horizontalGutter = gutter ? SCREEN_HORIZONTAL_GUTTER : 0;
  const safePadding = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: (edges.includes('left') ? insets.left : 0) + horizontalGutter,
    paddingRight: (edges.includes('right') ? insets.right : 0) + horizontalGutter,
  };

  if (!scroll) {
    return (
      <View className={cn('flex-1 bg-background', className)} style={safePadding}>
        <View className={cn('flex-1', contentClassName)}>{children}</View>
      </View>
    );
  }

  return (
    <View className={cn('flex-1 bg-background', className)}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: safePadding.paddingTop + 8,
          paddingBottom: Math.max(safePadding.paddingBottom, 24),
          paddingLeft: safePadding.paddingLeft,
          paddingRight: safePadding.paddingRight,
          ...scrollContentStyle,
        }}
        contentContainerClassName={contentClassName}
        showsVerticalScrollIndicator={false}
        {...restScrollProps}>
        {children}
      </ScrollView>
    </View>
  );
}
