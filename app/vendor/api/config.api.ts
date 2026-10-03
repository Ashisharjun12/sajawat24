import { api, unwrap } from '@/api/client';

export type InstantConfig = {
  dispatchEnabled: boolean;
  marketplaceEnabled: boolean;
  maps: {
    customerApp: boolean;
    vendorApp: boolean;
    web: boolean;
    liveTracking: boolean;
    provider: string;
  };
  presence?: {
    heartbeatSec: number;
    locationMinIntervalSec: number;
    locationMinMoveM: number;
  };
};

export function getInstantConfig() {
  return api.get('/config/instant').then(unwrap<InstantConfig>);
}
