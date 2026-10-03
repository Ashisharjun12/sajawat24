import { IconWell } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { Briefcase } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

export const BOOKINGS_EMPTY_IMAGE_URL =
  'https://ik.imagekit.io/aevhlnk0h/undraw_order-delivered_gy61.png';

type BookingsEmptyStateProps = {
  message: string;
  variant?: 'illustration' | 'icon';
};

export function BookingsEmptyState({ message, variant = 'illustration' }: BookingsEmptyStateProps) {
  return (
    <View className="items-center gap-4 px-4 py-10">
      {variant === 'icon' ? (
        <IconWell
          icon={Briefcase}
          size="lg"
          className="bg-muted"
          iconClassName="text-muted-foreground"
        />
      ) : (
        <Image
          source={{ uri: BOOKINGS_EMPTY_IMAGE_URL }}
          style={styles.image}
          contentFit="contain"
          transition={200}
          accessibilityLabel="No bookings illustration"
        />
      )}
      <Text className="text-muted-foreground max-w-sm text-center text-sm leading-5">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 280,
    height: 200,
    alignSelf: 'center',
  },
});
