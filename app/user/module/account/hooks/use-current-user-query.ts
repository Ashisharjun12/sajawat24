import { getMe } from '@/api/user.api';
import { mapPublicUserToCustomer } from '@/lib/auth.types';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useCurrentUserQuery() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const updateUser = useAuthStore((s) => s.updateUser);

  const query = useQuery({
    queryKey: queryKeys.currentUser(),
    enabled: Boolean(accessToken),
    queryFn: getMe,
    staleTime: 60_000,
  });

  useEffect(() => {
    const user = query.data?.user;
    if (!user) return;
    void updateUser(mapPublicUserToCustomer(user));
  }, [query.data?.user, updateUser]);

  return query;
}
