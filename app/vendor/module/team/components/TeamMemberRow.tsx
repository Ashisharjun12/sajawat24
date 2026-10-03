import type { TeamMember } from '@/api/team.api';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatIndiaPhoneDisplay } from '@/lib/phone';
import { Pressable, View } from 'react-native';

type Props = {
  member: TeamMember;
  onRemove?: () => void;
};

function statusLabel(status: TeamMember['status']) {
  switch (status) {
    case 'active':
      return 'Active';
    case 'invited':
      return 'Invited';
    case 'disabled':
      return 'Disabled';
  }
}

function statusChipClass(status: TeamMember['status']) {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/15';
    case 'invited':
      return 'bg-amber-500/15';
    case 'disabled':
      return 'bg-muted';
  }
}

function statusTextClass(status: TeamMember['status']) {
  switch (status) {
    case 'active':
      return 'text-emerald-800';
    case 'invited':
      return 'text-amber-800';
    case 'disabled':
      return 'text-muted-foreground';
  }
}

export function TeamMemberRow({ member, onRemove }: Props) {
  const phoneDisplay = formatIndiaPhoneDisplay(member.phone) || member.phone;
  const canRemove = member.status !== 'disabled' && onRemove;

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
          {member.displayName}
        </Text>
        <Text className="text-muted-foreground text-sm">{phoneDisplay}</Text>
      </View>
      <View
        className={cn('rounded-full px-2.5 py-1', statusChipClass(member.status))}>
        <Text className={cn('text-xs font-medium', statusTextClass(member.status))}>
          {statusLabel(member.status)}
        </Text>
      </View>
      {canRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          className="rounded-lg px-2 py-1">
          <Text className="text-destructive text-xs font-medium">Remove</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
