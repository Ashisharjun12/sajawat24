import { disableTeamMember } from '@/api/team.api';
import { getApiError } from '@/api/client';
import { PressableScale } from '@/components/motion';
import { PillFilter, Screen, ScreenHeader, SearchField } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { InviteWorkerModal } from '@/module/team/components/InviteWorkerModal';
import { TeamEmptyState } from '@/module/team/components/TeamEmptyState';
import { TeamMemberRow } from '@/module/team/components/TeamMemberRow';
import { useTeamMembers } from '@/module/team/hooks/use-team-members';
import { emptyMessageForFilter, teamFilterOptions, type TeamFilter } from '@/module/team/lib/team-filters';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowLeft, UserPlus } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { AppSpinner } from '@/components/ui/app-spinner';
import { LoadingPlaceholder } from '@/components/shell';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TeamScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<TeamFilter>('all');
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const {
    members,
    statusCounts,
    isLoading,
    isLoadingMore,
    isError,
    hasMore,
    loadMore,
    refetch,
  } = useTeamMembers(filter, search);

  const pillOptions = useMemo(() => teamFilterOptions(statusCounts), [statusCounts]);
  const hasSearch = search.trim().length > 0;

  const disableMutation = useMutation({
    mutationFn: disableTeamMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vendor-team'] });
    },
    onError: (err) => Alert.alert('Could not remove', getApiError(err)),
  });

  function confirmRemove(memberId: string, name: string) {
    Alert.alert('Remove worker?', `${name} will no longer be assigned to jobs.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => disableMutation.mutate(memberId),
      },
    ]);
  }

  const handleEndReached = useCallback(() => {
    loadMore();
  }, [loadMore]);

  const listHeader = useMemo(
    () => (
      <View className="gap-4 pb-2">
        <View className="mb-2 flex-row items-center gap-2">
          <Pressable
            onPress={() => router.back()}
            className="size-10 items-center justify-center rounded-full bg-muted"
            accessibilityLabel="Go back">
            <Icon as={ArrowLeft} className="text-foreground size-5" />
          </Pressable>
        </View>

        <ScreenHeader
          title="Team"
          subtitle="Workers who run jobs for your shop"
          showBell={false}
          trailing={
            <PressableScale
              className="size-11 items-center justify-center rounded-full bg-primary"
              onPress={() => setInviteOpen(true)}
              accessibilityLabel="Add worker"
              scaleTo={0.92}>
              <Icon as={UserPlus} className="size-5 text-primary-foreground" />
            </PressableScale>
          }
        />

        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Search workers by name or phone"
          accessibilityLabel="Search workers"
        />

        <PillFilter value={filter} options={pillOptions} onChange={setFilter} />
      </View>
    ),
    [filter, pillOptions, search],
  );

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <LoadingPlaceholder />
      );
    }
    if (isError) {
      return <TeamEmptyState message="Could not load team. Check your connection and try again." />;
    }
    return (
      <TeamEmptyState
        message={emptyMessageForFilter(filter, hasSearch)}
        onAddWorker={hasSearch ? undefined : () => setInviteOpen(true)}
      />
    );
  }, [filter, hasSearch, isError, isLoading]);

  const listFooter = useMemo(() => {
    if (!isLoadingMore) return <View style={{ height: insets.bottom }} />;
    return (
      <View className="items-center py-4">
        <AppSpinner size="sm" />
      </View>
    );
  }, [insets.bottom, isLoadingMore]);

  return (
    <Screen scroll={false} contentClassName="flex-1 pb-0">
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TeamMemberRow
            member={item}
            onRemove={() => confirmRemove(item.id, item.displayName)}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        ItemSeparatorComponent={() => <View className="h-2" />}
        contentContainerClassName="flex-grow px-5 pb-4 pt-4"
        keyboardShouldPersistTaps="handled"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.35}
        onRefresh={() => void refetch()}
        refreshing={isLoading && members.length > 0}
      />

      <InviteWorkerModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </Screen>
  );
}
