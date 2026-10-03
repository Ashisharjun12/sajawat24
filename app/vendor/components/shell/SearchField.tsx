import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
  accessibilityLabel?: string;
};

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search',
  className,
  accessibilityLabel = 'Search',
}: SearchFieldProps) {
  return (
    <View
      className={cn(
        'h-11 flex-row items-center gap-2 rounded-xl border border-border bg-card px-3',
        className,
      )}>
      <Icon as={Search} className="text-muted-foreground size-4 shrink-0" />
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
        className="h-10 flex-1 border-0 bg-transparent px-0 shadow-none"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityLabel="Clear search">
          <Icon as={X} className="text-muted-foreground size-4" />
        </Pressable>
      ) : null}
    </View>
  );
}
