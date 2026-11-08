import { Icon } from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

/** Section heading + white card holding divided rows (Account tab). */
export function ProfileMenuCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      {title ? (
        <Text className="text-muted-foreground px-1 text-xs font-semibold uppercase tracking-wider">
          {title}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-card border border-border bg-card">{children}</View>
    </View>
  );
}

function RowIcon({ icon, iconSlot }: { icon?: LucideIcon; iconSlot?: ReactNode }) {
  return (
    <View className="size-6 items-center justify-center">
      {iconSlot ?? (icon ? <Icon as={icon} className="text-foreground size-5" /> : null)}
    </View>
  );
}

type ProfileMenuCardRowProps = {
  label: string;
  icon?: LucideIcon;
  iconSlot?: ReactNode;
  subtitle?: string;
  onPress: () => void;
  isLast?: boolean;
};

/** Row inside a `ProfileMenuCard`: icon · label (+ subtitle) · chevron, hairline divider. */
export function ProfileMenuCardRow({
  label,
  icon,
  iconSlot,
  subtitle,
  onPress,
  isLast = false,
}: ProfileMenuCardRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3.5 pl-4 active:bg-muted/60"
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${label}, ${subtitle}` : label}>
      <RowIcon icon={icon} iconSlot={iconSlot} />
      <View
        className={cn(
          'min-h-14 flex-1 flex-row items-center gap-2 py-3 pr-4',
          !isLast && 'border-b border-border/70',
        )}>
        <Text className="text-foreground min-w-0 flex-1 text-[15px] font-medium">{label}</Text>
        {subtitle ? (
          <Text className="text-muted-foreground shrink-0 text-sm">{subtitle}</Text>
        ) : null}
        <Icon as={ChevronRight} className="text-muted-foreground/70 size-5 shrink-0" />
      </View>
    </Pressable>
  );
}

/** Toggle row inside a `ProfileMenuCard`. */
export function ProfileMenuCardToggleRow({
  label,
  icon,
  value,
  onValueChange,
  isLast = false,
}: {
  label: string;
  icon: LucideIcon;
  value: boolean;
  onValueChange: (next: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-3.5 pl-4">
      <RowIcon icon={icon} />
      <View
        className={cn(
          'min-h-14 flex-1 flex-row items-center gap-2 py-3 pr-4',
          !isLast && 'border-b border-border/70',
        )}>
        <Text className="text-foreground min-w-0 flex-1 text-[15px] font-medium">{label}</Text>
        <Switch checked={value} onCheckedChange={onValueChange} accessibilityLabel={label} />
      </View>
    </View>
  );
}
