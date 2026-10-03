import { PressableScale } from '@/components/motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  formatProfileLocation,
  getProfileInitials,
} from '@/module/profile/lib/profile-format';
import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

type ProfileHeaderRowProps = {
  name: string;
  avatarUrl?: string | null;
  cityName?: string | null;
  state?: string | null;
  onPress: () => void;
};

export function ProfileHeaderRow({
  name,
  avatarUrl,
  cityName,
  state,
  onPress,
}: ProfileHeaderRowProps) {
  const initials = getProfileInitials(name);
  const location = formatProfileLocation(cityName, state);

  return (
    <PressableScale onPress={onPress} scaleTo={0.99}>
      <View className="flex-row items-center gap-3 border-b border-border/40 px-1 py-4">
        <View className="rounded-full border-2 border-border/60 p-0.5">
          <Avatar className="size-14" alt={name}>
            {avatarUrl ? <AvatarImage source={{ uri: avatarUrl }} /> : null}
            <AvatarFallback className="bg-primary/15">
              <Text className="text-primary text-base font-semibold">{initials}</Text>
            </AvatarFallback>
          </Avatar>
        </View>

        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-foreground text-lg font-semibold" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-muted-foreground text-sm">Edit profile</Text>
          {location ? (
            <Text className="text-muted-foreground text-xs" numberOfLines={1}>
              {location}
            </Text>
          ) : null}
        </View>

        <Icon as={ChevronRight} className="text-muted-foreground size-5 shrink-0" />
      </View>
    </PressableScale>
  );
}
