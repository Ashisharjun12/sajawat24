import { getApiError } from '@/api/client';
import type { TeamMember } from '@/api/team.api';
import { assignSelfToJob, listJobAssignments, setJobAssignments } from '@/api/team.api';
import { Button } from '@/components/ui/button';
import { OnboardingButton } from '@/module/onboarding/components/OnboardingButton';
import { useAuthStore } from '@/store/auth.store';
import { vendorJobsKeys } from '@/module/bookings/hooks/use-vendor-jobs';
import { notificationQueryKeys } from '@/module/notifications/lib/notification-query-keys';
import { AssignWorkerConfirmSheet } from '@/module/team/components/AssignWorkerConfirmSheet';
import { AssignWorkerPickerSheet } from '@/module/team/components/AssignWorkerPickerSheet';
import { AssignedWorkerChip } from '@/module/team/components/AssignedWorkerChip';
import { SelfAssignConfirmSheet } from '@/module/team/components/SelfAssignConfirmSheet';
import { Text } from '@/components/ui/text';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, View } from 'react-native';

type Props = {
  orderId: string;
  accepted: boolean;
};

function invalidateAssignmentQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: string,
) {
  void queryClient.invalidateQueries({ queryKey: ['job-assignments', orderId] });
  void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.all });
  void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
}

export function JobAssignSection({ orderId, accepted }: Props) {
  const queryClient = useQueryClient();
  const ownerMemberId = useAuthStore((s) => s.user?.partnerMembership?.memberId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selfAssignOpen, setSelfAssignOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<TeamMember | null>(null);

  const { data: assignments } = useQuery({
    queryKey: ['job-assignments', orderId],
    queryFn: () => listJobAssignments(orderId),
    enabled: accepted,
  });

  const assignMutation = useMutation({
    mutationFn: (memberIds: string[]) => setJobAssignments(orderId, memberIds),
    onSuccess: () => {
      invalidateAssignmentQueries(queryClient, orderId);
      setConfirmOpen(false);
      setPickerOpen(false);
      setSelectedWorker(null);
    },
    onError: (err) => Alert.alert('Assign failed', getApiError(err)),
  });

  const selfAssignMutation = useMutation({
    mutationFn: () => assignSelfToJob(orderId),
    onSuccess: () => {
      invalidateAssignmentQueries(queryClient, orderId);
      setSelfAssignOpen(false);
    },
    onError: (err) => Alert.alert('Could not assign you', getApiError(err)),
  });

  if (!accepted) return null;

  const assigned = assignments?.[0] ?? null;
  const assignedMemberId = assigned?.memberId ?? null;
  const isAssignedToSelf = Boolean(ownerMemberId && assignedMemberId === ownerMemberId);
  const assignBusy = assignMutation.isPending || selfAssignMutation.isPending;

  function openPicker() {
    setPickerOpen(true);
  }

  function handleSelectWorker(worker: TeamMember) {
    setSelectedWorker(worker);
    setPickerOpen(false);
    setConfirmOpen(true);
  }

  function handleConfirmAssign() {
    if (!selectedWorker) return;
    assignMutation.mutate([selectedWorker.id]);
  }

  function handleUnassign() {
    assignMutation.mutate([]);
  }

  function openSelfAssignSheet() {
    setSelfAssignOpen(true);
  }

  function handleConfirmSelfAssign() {
    selfAssignMutation.mutate();
  }

  const isReassign = Boolean(assignedMemberId && selectedWorker && assignedMemberId !== selectedWorker.id);
  const isSelfReassign = Boolean(assignedMemberId && !isAssignedToSelf);

  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="gap-1">
        <Text className="text-foreground text-base font-semibold">Field worker</Text>
        <Text className="text-muted-foreground text-sm">
          One worker per job. Assign yourself before switching to worker mode, or pick someone from
          your team.
        </Text>
      </View>

      <AssignedWorkerChip orderId={orderId} enabled={accepted} />

      {!isAssignedToSelf ? (
        <Button
          className="h-12 rounded-2xl"
          variant="secondary"
          disabled={assignBusy || !ownerMemberId}
          onPress={openSelfAssignSheet}>
          <Text className="font-semibold">I&apos;ll do this job</Text>
        </Button>
      ) : null}

      <OnboardingButton onPress={openPicker} disabled={assignBusy}>
        <Text className="font-semibold">
          {assignedMemberId ? 'Assign a team worker' : 'Assign team worker'}
        </Text>
      </OnboardingButton>

      <AssignWorkerPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectWorker={handleSelectWorker}
        assignedMemberId={assignedMemberId}
      />

      <AssignWorkerConfirmSheet
        open={confirmOpen}
        worker={selectedWorker}
        loading={assignBusy}
        isReassign={isReassign}
        onClose={() => {
          setConfirmOpen(false);
          setSelectedWorker(null);
        }}
        onConfirmAssign={handleConfirmAssign}
        onUnassign={
          assignedMemberId && selectedWorker?.id === assignedMemberId
            ? handleUnassign
            : undefined
        }
      />

      <SelfAssignConfirmSheet
        open={selfAssignOpen}
        loading={selfAssignMutation.isPending}
        isReassign={isSelfReassign}
        onClose={() => setSelfAssignOpen(false)}
        onConfirmSelfAssign={handleConfirmSelfAssign}
      />
    </View>
  );
}
