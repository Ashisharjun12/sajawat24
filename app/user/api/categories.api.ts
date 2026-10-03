import { api, unwrap } from '@/api/client';

export function listCategories() {
  return api.get('/catalog/categories').then(unwrap);
}
