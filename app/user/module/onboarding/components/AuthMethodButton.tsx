import { AppSpinner } from '@/components/ui/app-spinner';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, View } from 'react-native';

type AuthMethodButtonProps = PressableProps & {
  label: string;
  icon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  tone?: 'default' | 'primary';
};

export function AuthMethodButton({
  label,
  icon,
  loading,
  loadingLabel = 'Loading…',
  disabled,
  tone = 'default',
  className,
  ...props
}: AuthMethodButtonProps) {
  const isPrimary = tone === 'primary';
  const labelClass = cn(
    'text-[15px] font-semibold',
    isPrimary ? 'text-primary-foreground' : 'text-foreground',
  );

  return (
    <Pressable
      disabled={disabled || loading}
      className={cn(
        'h-12 w-full flex-row items-center justify-center gap-2.5 rounded-full',
        isPrimary
          ? 'border-0 bg-primary active:bg-primary/90'
          : 'border border-border bg-background active:bg-muted/50',
        disabled && !loading && 'opacity-60',
        className,
      )}
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
      {...props}>
      {loading ? (
        <View className="w-full flex-row items-center justify-center gap-2.5">
          <AppSpinner size="sm" />
          <Text className={labelClass}>{loadingLabel}</Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-center gap-2.5">
          {icon}
          <Text className={labelClass}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
