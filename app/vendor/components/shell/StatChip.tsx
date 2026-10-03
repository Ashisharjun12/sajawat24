import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { View } from 'react-native';

type StatChipProps = {
  label: string;
  value: string;
  className?: string;
};

export function StatChip({ label, value, className }: StatChipProps) {
  return (
    <View className={cn('flex-1 rounded-2xl bg-muted px-4 py-3', className)}>
      <Text className="text-foreground text-base font-semibold">{value}</Text>
      <Text className="text-muted-foreground mt-0.5 text-xs">{label}</Text>
    </View>
  );
}

export function StatChipRow({ children }: { children: React.ReactNode }) {
  return <View className="flex-row gap-2">{children}</View>;
}
