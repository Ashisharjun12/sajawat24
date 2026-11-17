import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react-native';

type ViewAllButtonProps = {
  onPress: () => void;
  label?: string;
  accessibilityLabel?: string;
  className?: string;
};

/**
 * "View all" button (rectangle, 8px corners) on section headers (home category rows, product rails).
 * Theme tint background + primary text, so it follows light/dark and the brand colour (web parity).
 */
export function ViewAllButton({
  onPress,
  label = 'View all',
  accessibilityLabel,
  className,
}: ViewAllButtonProps) {
  return (
    <ScalePressable
      onPress={onPress}
      haptic
      className={cn(
        'shrink-0 flex-row items-center gap-1 self-center rounded-[8px] bg-primary-tint px-3 py-1.5',
        className,
      )}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}>
      <Text className="text-primary text-xs font-bold">{label}</Text>
      <Icon as={ArrowRight} className="text-primary size-3.5" strokeWidth={2.5} />
    </ScalePressable>
  );
}
