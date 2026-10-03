import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

type HomeStatCardProps = {
  label: string;
  value: string;
};

export function HomeStatCard({ label, value }: HomeStatCardProps) {
  return (
    <Card className="flex-1 py-4">
      <CardContent className="gap-1">
        <Text className="text-foreground text-lg font-semibold">{value}</Text>
        <Text className="text-muted-foreground text-xs leading-4">{label}</Text>
      </CardContent>
    </Card>
  );
}

export function HomeStatRow({ children }: { children: React.ReactNode }) {
  return <View className="flex-row gap-3">{children}</View>;
}
