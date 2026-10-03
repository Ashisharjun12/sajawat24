import type { PillOption } from '@/components/shell';
import type { TeamStatusCounts } from '@/api/team.api';

export type TeamFilter = 'all' | 'active' | 'invited' | 'disabled';

export function teamFilterOptions(counts: TeamStatusCounts): PillOption<TeamFilter>[] {
  return [
    { value: 'all', label: 'All', badgeCount: counts.all > 0 ? counts.all : undefined },
    { value: 'active', label: 'Active', badgeCount: counts.active > 0 ? counts.active : undefined },
    { value: 'invited', label: 'Invited', badgeCount: counts.invited > 0 ? counts.invited : undefined },
    {
      value: 'disabled',
      label: 'Disabled',
      badgeCount: counts.disabled > 0 ? counts.disabled : undefined,
    },
  ];
}

export function emptyMessageForFilter(filter: TeamFilter, hasSearch: boolean): string {
  if (hasSearch) {
    return 'No workers match your search. Try a different name or phone number.';
  }
  switch (filter) {
    case 'active':
      return 'No active workers yet. Invite someone to join your team.';
    case 'invited':
      return 'No pending invites. Tap Add worker to send an invite.';
    case 'disabled':
      return 'No disabled workers.';
    default:
      return 'No workers yet. Tap Add worker to invite your first team member.';
  }
}
