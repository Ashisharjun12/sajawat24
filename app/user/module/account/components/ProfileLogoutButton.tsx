import { AppSpinner } from '@/components/ui/app-spinner';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { LogOut } from 'lucide-react-native';
import { Pressable } from 'react-native';

type ProfileLogoutButtonProps = {
  onPress: () => void;
  loading?: boolean;
};

export function ProfileLogoutButton({ onPress, loading = false }: ProfileLogoutButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="mt-2 flex-row items-center justify-center gap-2 py-4 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={loading ? 'Logging out' : 'Sign out'}
      accessibilityState={{ disabled: loading, busy: loading }}>
      {loading ? (
        <AppSpinner size="sm" />
      ) : (
        <Icon as={LogOut} className="text-destructive size-5" />
      )}
      <Text className="text-destructive text-base font-semibold">
        {loading ? 'Logging out…' : 'Log out'}
      </Text>
    </Pressable>
  );
}
