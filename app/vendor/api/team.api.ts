import { api, unwrap } from '@/api/client';

export type TeamMember = {
  id: string;
  displayName: string;
  phone: string;
  kind: 'OWNER' | 'WORKER';
  status: 'invited' | 'active' | 'disabled';
  userId: string | null;
};

export type TeamStatusCounts = {
  all: number;
  active: number;
  invited: number;
  disabled: number;
};

export type TeamListResponse = {
  items: TeamMember[];
  page: number;
  limit: number;
  total: number;
  statusCounts: TeamStatusCounts;
};

export type FieldAssignment = {
  id: string;
  orderId: string;
  memberId: string;
  displayName: string;
  kind: 'OWNER' | 'WORKER';
  userId: string | null;
};

export type ListTeamMembersParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: 'active' | 'invited' | 'disabled';
};

export async function listTeamMembersPage(params?: ListTeamMembersParams) {
  const res = await api.get('/vendor/team', { params });
  return unwrap<TeamListResponse>(res);
}

/** All assignable workers for job assignment (non-disabled). */
export async function listAssignableTeamMembers() {
  const res = await listTeamMembersPage({ page: 1, limit: 100 });
  return res.items.filter((m) => m.kind === 'WORKER' && m.status !== 'disabled');
}

export async function inviteTeamMember(input: { phone: string; displayName: string }) {
  const res = await api.post('/vendor/team', input);
  return unwrap<TeamMember>(res);
}

export async function disableTeamMember(memberId: string) {
  await api.delete(`/vendor/team/${memberId}`);
}

export async function listJobAssignments(orderId: string) {
  const res = await api.get(`/vendor/jobs/${orderId}/assignments`);
  return unwrap<FieldAssignment[]>(res);
}

export async function setJobAssignments(orderId: string, memberIds: string[]) {
  const res = await api.put(`/vendor/jobs/${orderId}/assignments`, { memberIds });
  return unwrap<FieldAssignment[]>(res);
}

export async function assignSelfToJob(orderId: string) {
  const res = await api.post(`/vendor/jobs/${orderId}/assignments/self`);
  return unwrap<FieldAssignment[]>(res);
}
