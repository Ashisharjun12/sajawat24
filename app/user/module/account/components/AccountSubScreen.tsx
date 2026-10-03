import { Screen, TabScreenTitle } from '@/components/shell';
import { cn } from '@/lib/utils';
import { useGoBack } from '@/lib/use-go-back';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type AccountSubScreenProps = {
  title: string;
  children: ReactNode;
  contentClassName?: string;
};

export function AccountSubScreen({ title, children, contentClassName }: AccountSubScreenProps) {
  const onBack = useGoBack();
  return (
    <Screen edges={['top', 'left', 'right']} gutter contentClassName={cn('pb-10', contentClassName)}>
      <TabScreenTitle title={title} showBack onBack={onBack} insetFromParentGutter />
      <View className="mt-4 gap-5">{children}</View>
    </Screen>
  );
}
