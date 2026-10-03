import { API_URL } from '@/lib/env';

const TAG = '[Decory API]';

export type DevApiLogKind = 'request' | 'response' | 'error' | 'info';

export function devApiBaseUrl(configBase?: string | null): string {
  const fromConfig = configBase?.trim();
  if (fromConfig) return fromConfig;
  if (API_URL) return API_URL;
  return '(EXPO_PUBLIC_API_URL not set)';
}

export function devApiLog(
  kind: DevApiLogKind,
  summary: string,
  detail?: Record<string, unknown>,
): void {
  if (!__DEV__) return;
  const line = `${TAG} ${summary}`;
  if (kind === 'error') {
    console.warn(line, detail ?? '');
    return;
  }
  console.log(line, detail ?? '');
}
