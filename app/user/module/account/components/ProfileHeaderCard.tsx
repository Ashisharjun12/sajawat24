import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { formatIndiaPhoneDisplay } from '@/lib/phone';
import { profileInitials } from '@/module/account/lib/profile-initials';
import { useAuthStore } from '@/store/auth.store';
import { Href, router } from 'expo-router';
import { Mail, PenLine, UserRound } from 'lucide-react-native';
import { View } from 'react-native';

const PERSONAL_INFO_HREF = '/(app)/profile/account' as Href;
const LOGIN_HREF = '/(onboarding)/login' as Href;

function ContactLine({ icon, label }: { icon?: typeof Mail; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon ? <Icon as={icon} className="text-muted-foreground size-3.5 shrink-0" /> : null}
      <Text className="text-muted-foreground min-w-0 flex-1 text-sm" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Top card on the Account tab. Signed in: avatar, name, email/phone and an edit button
 * (opens Personal info). Signed out: a sign-in prompt.
 */
export function ProfileHeaderCard() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return (
      <View className="flex-row items-center gap-4 rounded-card border border-border bg-card p-4">
        <View className="size-14 items-center justify-center rounded-full bg-primary-tint">
          <Icon as={UserRound} className="text-primary size-6" />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-foreground text-h3 font-semibold">Welcome</Text>
          <Text className="text-muted-foreground text-sm" numberOfLines={2}>
            Sign in to see your orders, addresses and saved setups.
          </Text>
        </View>
        <Button size="sm" onPress={() => router.push(LOGIN_HREF)} accessibilityLabel="Sign in">
          <Text>Sign in</Text>
        </Button>
      </View>
    );
  }

  const name = user.name?.trim() || 'Your account';
  const email = user.email?.trim() ?? '';
  const phone = user.phone?.trim() ? formatIndiaPhoneDisplay(user.phone) : '';

  return (
    <ScalePressable
      onPress={() => router.push(PERSONAL_INFO_HREF)}
      haptic
      className="flex-row items-center gap-4 rounded-card border border-border bg-card p-4"
      accessibilityRole="button"
      accessibilityLabel={`${name}. Edit personal info`}>
      <Avatar alt={name} className="size-14 border-2 border-primary-tint">
        {user.avatar ? <AvatarImage source={{ uri: user.avatar }} /> : null}
        <AvatarFallback className="bg-primary-tint">
          <Text className="text-primary text-lg font-semibold">{profileInitials(user.name ?? '')}</Text>
        </AvatarFallback>
      </Avatar>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="text-foreground text-h3 font-semibold" numberOfLines={1}>
          {name}
        </Text>
        {email ? <ContactLine icon={Mail} label={email} /> : null}
        {/* The phone text already starts with the 🇮🇳 flag, so no extra phone icon. */}
        {phone ? <ContactLine label={phone} /> : null}
        {!email && !phone ? <ContactLine icon={Mail} label="Add your contact details" /> : null}
      </View>
      {/* Edit affordance — the whole card opens Personal info. */}
      <View className="size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon as={PenLine} className="text-foreground size-4" />
      </View>
    </ScalePressable>
  );
}
