import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from "@/api/addresses.api";
import { queryKeys } from "@/lib/query-keys";

export function useAddressesQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.addresses(),
    queryFn: () => listAddresses(),
    staleTime: 60_000,
    ...options,
  });
}

export function useAddressMutations() {
  const queryClient = useQueryClient();

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.addresses() });
  }

  const create = useMutation({
    mutationFn: (body) => createAddress(body),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, body }) => updateAddress(id, body),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id) => deleteAddress(id),
    onSuccess: invalidate,
  });

  const setDefault = useMutation({
    mutationFn: (id) => setDefaultAddress(id),
    onSuccess: invalidate,
  });

  return { create, update, remove, setDefault };
}
