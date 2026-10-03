import type { MapsSdkConfig } from '@/api/maps.api';
import { TransformRequestManager } from '@maplibre/maplibre-react-native';

const BEARER_HEADER_ID = 'decory-ola-bearer';
const API_KEY_PARAM_ID = 'decory-ola-api-key';
/** Tiles, styles, glyphs, and sprites may use any olamaps.io host. */
const OLA_HOST_MATCH = 'olamaps\\.io';

export function clearOlaMapAuth() {
  TransformRequestManager.removeHeader(BEARER_HEADER_ID);
  TransformRequestManager.removeUrlSearchParam(API_KEY_PARAM_ID);
}

export function applyOlaMapAuth(config: MapsSdkConfig) {
  clearOlaMapAuth();

  if (config.authMode === 'oauth' && config.accessToken) {
    TransformRequestManager.addHeader({
      id: BEARER_HEADER_ID,
      match: OLA_HOST_MATCH,
      name: 'Authorization',
      value: `Bearer ${config.accessToken}`,
    });
    return;
  }

  if (config.authMode === 'api_key' && config.apiKey) {
    TransformRequestManager.addUrlSearchParam({
      id: API_KEY_PARAM_ID,
      match: OLA_HOST_MATCH,
      name: 'api_key',
      value: config.apiKey,
    });
  }
}
