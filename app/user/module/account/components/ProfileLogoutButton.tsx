import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { LogOut } from 'lucide-react-native';
import { Pressable } from 'react-native';

type ProfileLogoutButtonProps = {
  onPress: () => void;
};

export function ProfileLogoutButton({ onPress }: ProfileLogoutButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mt-2 flex-row items-center justify-center gap-2 py-4 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel="Sign out">
      <Icon as={LogOut} className="text-destructive size-5" />
      <Text className="text-destructive text-base font-semibold">Log out</Text>
    </Pressable>
  );
}
