import { Screen } from '@/components/shell';
import { Text } from '@/components/ui/text';

type TabStubScreenProps = {
  title: string;
  description: string;
};

export function TabStubScreen({ title, description }: TabStubScreenProps) {
  return (
    <Screen contentClassName="px-5 pt-6">
      <Text className="text-foreground text-2xl font-bold">{title}</Text>
      <Text className="text-muted-foreground mt-2 text-base leading-6">{description}</Text>
    </Screen>
  );
}
