import { listJobAssignments } from '@/api/team.api';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

type Props = {
  orderId: string;
  enabled?: boolean;
};

export function AssignedWorkerChip({ orderId, enabled = true }: Props) {
  const ownerMemberId = useAuthStore((s) => s.user?.partnerMembership?.memberId);
  const { data: assignments } = useQuery({
    queryKey: ['job-assignments', orderId],
    queryFn: () => listJobAssignments(orderId),
    enabled: enabled && Boolean(orderId),
  });

  const worker = assignments?.[0];
  if (!worker) return null;

  const isYou = Boolean(ownerMemberId && worker.memberId === ownerMemberId);
  const label = isYou ? 'Assigned: You' : `Assigned: ${worker.displayName}`;

  return (
    <View className="self-start rounded-full bg-muted px-3 py-1.5">
      <Text className="text-foreground text-xs font-medium">{label}</Text>
    </View>
  );
}
