import { api, unwrap } from '@/api/client';

export function deleteAccount() {
  return api.post('/user/account/delete').then(unwrap<{ deleted: boolean }>);
}
