import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { NotificationInboxFilter } from '@/module/notifications/lib/notification-inbox-filter';
import { Pressable, View } from 'react-native';

const FILTERS: { id: NotificationInboxFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'offers', label: 'Offers' },
  { id: 'updates', label: 'Updates' },
];

type NotificationInboxFilterChipsProps = {
  value: NotificationInboxFilter;
  onChange: (value: NotificationInboxFilter) => void;
};

export function NotificationInboxFilterChips({ value, onChange }: NotificationInboxFilterChipsProps) {
  return (
    <View className="mb-3 flex-row gap-2">
      {FILTERS.map((chip) => {
        const active = chip.id === value;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onChange(chip.id)}
            className="active:opacity-80">
            <View
              className={cn(
                'rounded-full border px-4 py-2',
                active
                  ? 'border-foreground bg-foreground'
                  : 'border-border bg-surface',
              )}>
              <Text
                className={cn(
                  'text-sm font-semibold',
                  active ? 'text-background' : 'text-foreground',
                )}>
                {chip.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
