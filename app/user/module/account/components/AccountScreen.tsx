import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatIndiaPhoneDisplay } from '@/lib/phone';
import { AccountInfoRow } from '@/module/account/components/AccountInfoRow';
import { AccountSubScreen } from '@/module/account/components/AccountSubScreen';
import { LinkGoogleSheet } from '@/module/account/components/LinkGoogleSheet';
import { LinkPhoneSheet } from '@/module/account/components/LinkPhoneSheet';
import { ProfileSettingsGroup } from '@/module/account/components/ProfileSettingsGroup';
import { profileInitials } from '@/module/account/lib/profile-initials';
import { useCurrentUserQuery } from '@/module/account/hooks/use-current-user-query';
import { useAuthStore } from '@/store/auth.store';
import { useState } from 'react';
import { View } from 'react-native';

export function AccountScreen() {
  const user = useAuthStore((s) => s.user);
  const { isPending } = useCurrentUserQuery();
  const loading = isPending && !user;
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [googleOpen, setGoogleOpen] = useState(false);

  const hasPhone = Boolean(user?.phone?.trim());
  const hasGoogle = Boolean(user?.linkedGoogle);
  const name = user?.name?.trim() || '—';
  const email = user?.email?.trim() || 'Not linked';
  const phoneDisplay = hasPhone
    ? formatIndiaPhoneDisplay(user!.phone!)
    : 'Not linked';

  return (
    <AccountSubScreen title="Personal info">
      {loading ? (
        <View className="gap-4">
          <View className="flex-row items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-7 w-40 rounded-md" />
          </View>
          <Skeleton className="h-32 w-full rounded-2xl" />
        </View>
      ) : (
        <>
          <View className="flex-row items-center gap-4">
            <Avatar alt={name} className="size-16 border-2 border-border">
              {user?.avatar ? <AvatarImage source={{ uri: user.avatar }} alt="" /> : null}
              <AvatarFallback className="bg-muted">
                <Text className="text-foreground text-lg font-semibold">
                  {profileInitials(user?.name ?? '')}
                </Text>
              </AvatarFallback>
            </Avatar>
            <View className="min-w-0 flex-1">
              <Text className="text-foreground text-xl font-bold tracking-tight" numberOfLines={2}>
                {name}
              </Text>
            </View>
          </View>

          <ProfileSettingsGroup title="Contact details">
            <View className="overflow-hidden rounded-2xl border border-border bg-card px-4">
              <AccountInfoRow
                label="Email"
                value={email}
                onActionPress={!hasGoogle ? () => setGoogleOpen(true) : undefined}
                actionLabel={!hasGoogle ? 'Link' : undefined}
              />
              <AccountInfoRow
                label="Phone number"
                value={phoneDisplay}
                onActionPress={() => setPhoneOpen(true)}
                actionLabel={hasPhone ? 'Edit' : 'Add'}
                isLast
              />
            </View>
          </ProfileSettingsGroup>
        </>
      )}

      <LinkPhoneSheet open={phoneOpen} onOpenChange={setPhoneOpen} hasPhone={hasPhone} />
      <LinkGoogleSheet open={googleOpen} onOpenChange={setGoogleOpen} />
    </AccountSubScreen>
  );
}
