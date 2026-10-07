import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { ScrollView } from 'react-native';

type ChatQuickReplyChipsProps = {
  suggestions: readonly string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
};

export function ChatQuickReplyChips({
  suggestions,
  onSelect,
  disabled = false,
}: ChatQuickReplyChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-2"
      className={cn(disabled && 'opacity-50')}>
      {suggestions.map((label) => (
        <ScalePressable
          key={label}
          haptic
          disabled={disabled}
          onPress={() => {
            if (disabled) return;
            onSelect(label);
          }}
          className="rounded-full border border-primary/40 bg-primary-tint px-4 py-2"
          accessibilityRole="button"
          accessibilityLabel={`Send message: ${label}`}>
          <Text className="text-sm font-medium text-primary">{label}</Text>
        </ScalePressable>
      ))}
    </ScrollView>
  );
}
