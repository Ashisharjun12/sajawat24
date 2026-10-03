import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

type IconWellProps = {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: { box: 'size-9', icon: 'size-4' },
  md: { box: 'size-10', icon: 'size-5' },
  lg: { box: 'size-12', icon: 'size-6' },
};

export function IconWell({ icon, className, iconClassName, size = 'md' }: IconWellProps) {
  const dims = sizeMap[size];
  return (
    <View
      className={cn('items-center justify-center rounded-full bg-primary/12', dims.box, className)}>
      <Icon as={icon} className={cn('text-foreground', dims.icon, iconClassName)} />
    </View>
  );
}
