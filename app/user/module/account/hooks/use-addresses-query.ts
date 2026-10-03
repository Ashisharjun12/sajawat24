import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
  type CreateAddressBody,
  type PatchAddressBody,
} from '@/api/addresses.api';
import { queryKeys } from '@/lib/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useAddressesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.addresses(),
    queryFn: () => listAddresses(),
    staleTime: 60_000,
    enabled,
  });
}

export function useAddressMutations() {
  const queryClient = useQueryClient();

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.addresses() });
  }

  const create = useMutation({
    mutationFn: (body: CreateAddressBody) => createAddress(body),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: PatchAddressBody }) => updateAddress(id, body),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: invalidate,
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: invalidate,
  });

  return { create, update, remove, setDefault };
}
