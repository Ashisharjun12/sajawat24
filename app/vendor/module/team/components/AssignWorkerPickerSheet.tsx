import type { TeamMember } from '@/api/team.api';
import { LoadingPlaceholder, SearchField } from '@/components/shell';
import { AppSpinner } from '@/components/ui/app-spinner';
import { Text } from '@/components/ui/text';
import { formatIndiaPhoneDisplay } from '@/lib/phone';
import { useAssignableWorkers } from '@/module/team/hooks/use-assignable-workers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectWorker: (worker: TeamMember) => void;
  assignedMemberId?: string | null;
};

function WorkerPickerRow({
  member,
  selected,
  onPress,
}: {
  member: TeamMember;
  selected: boolean;
  onPress: () => void;
}) {
  const phone = formatIndiaPhoneDisplay(member.phone) || member.phone;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
      <View className="min-w-0 flex-1">
        <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
          {member.displayName}
        </Text>
        <Text className="text-muted-foreground text-sm">{phone}</Text>
      </View>
      {selected ? (
        <Text className="text-primary text-xs font-semibold">Assigned</Text>
      ) : (
        <Text className="text-muted-foreground text-xs">Select</Text>
      )}
    </Pressable>
  );
}

export function AssignWorkerPickerSheet({
  open,
  onClose,
  onSelectWorker,
  assignedMemberId,
}: Props) {
  const insets = useSafeAreaInsets();
  const sheetBottomPadding = Math.max(insets.bottom, 16);
  const [search, setSearch] = useState('');
  const { workers, isLoading, isLoadingMore, isError, loadMore, refetch } =
    useAssignableWorkers(search, open);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const handleEndReached = useCallback(() => {
    loadMore();
  }, [loadMore]);

  const listFooter = useMemo(() => {
    if (!isLoadingMore) return <View className="h-2" />;
    return (
      <View className="items-center py-3">
        <AppSpinner size="sm" />
      </View>
    );
  }, [isLoadingMore]);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 justify-end">
          <Pressable className="absolute inset-0 bg-black/45" onPress={onClose} />
          <View
            className="h-1/2 max-h-[50%] rounded-t-3xl bg-background pt-5"
            style={{ paddingBottom: sheetBottomPadding }}>
            <View className="shrink-0 px-5">
              <View className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/30" />
              <Text className="text-foreground text-center text-xl font-semibold">
                Assign worker
              </Text>
              <Text className="text-muted-foreground mt-2 text-center text-sm leading-5">
                Choose an active team member. They&apos;ll get a notification for this job.
              </Text>
              <SearchField
                className="mt-4"
                value={search}
                onChangeText={setSearch}
                placeholder="Search workers"
                accessibilityLabel="Search workers"
              />
            </View>

            {isLoading ? (
              <LoadingPlaceholder className="flex-1 py-8" />
            ) : isError ? (
              <View className="flex-1 items-center justify-center gap-3 px-5">
                <Text className="text-muted-foreground text-center text-sm">
                  Could not load team. Try again.
                </Text>
                <Pressable onPress={() => void refetch()}>
                  <Text className="text-primary text-sm font-semibold">Retry</Text>
                </Pressable>
              </View>
            ) : workers.length === 0 ? (
              <View className="flex-1 justify-center px-5">
                <Text className="text-muted-foreground text-center text-sm">
                  No active workers found. Invite someone from Profile → Team.
                </Text>
              </View>
            ) : (
              <FlatList
                data={workers}
                keyExtractor={(item) => item.id}
                className="mt-3 flex-1 px-5"
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View className="h-2" />}
                renderItem={({ item }) => (
                  <WorkerPickerRow
                    member={item}
                    selected={assignedMemberId === item.id}
                    onPress={() => onSelectWorker(item)}
                  />
                )}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.35}
                ListFooterComponent={listFooter}
              />
            )}

            <Pressable onPress={onClose} className="shrink-0 px-5 py-3">
              <Text className="text-center text-sm font-medium text-muted-foreground">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
