import { api, unwrap } from '@/api/client';

export function listSections({ pincode, cityId }: { pincode?: string; cityId?: string } = {}) {
  return api
    .get('/catalog/sections', {
      params: {
        ...(pincode ? { pincode } : {}),
        ...(cityId ? { cityId } : {}),
      },
    })
    .then(unwrap);
}
