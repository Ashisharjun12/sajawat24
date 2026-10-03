import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

type Props = {
  message: string;
  onAddWorker?: () => void;
};

export function TeamEmptyState({ message, onAddWorker }: Props) {
  return (
    <View className="items-center gap-4 px-4 py-12">
      <Text className="text-muted-foreground max-w-sm text-center text-sm leading-6">{message}</Text>
      {onAddWorker ? (
        <Button className="h-11 rounded-xl px-6" onPress={onAddWorker}>
          <Text>Add worker</Text>
        </Button>
      ) : null}
    </View>
  );
}
