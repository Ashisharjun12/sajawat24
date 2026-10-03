import { API_URL } from '@/lib/env';
import { loadPartnerMode, type PartnerMode } from '@/lib/partner-mode';
import { loadAccessToken } from '@/lib/secure-storage';

export type BackgroundLocationPostBody = {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
};

export type BackgroundLocationPostResult = {
  ok: boolean;
  suggestOnSite?: boolean;
};

export class BackgroundLocationPostError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function resolvePartnerModeForBackgroundPost(): Promise<PartnerMode> {
  const stored = await loadPartnerMode();
  return stored === 'owner' ? 'owner' : 'field';
}

/**
 * POST job location from the headless GPS task (no Zustand / axios interceptors).
 */
export async function postJobLocationBackground(
  orderId: string,
  body: BackgroundLocationPostBody,
): Promise<BackgroundLocationPostResult> {
  const base = API_URL?.replace(/\/$/, '');
  if (!base) {
    throw new BackgroundLocationPostError(0, 'API_URL not configured');
  }

  const token = (await loadAccessToken())?.trim();
  if (!token) {
    throw new BackgroundLocationPostError(401, 'missing access token');
  }

  const partnerMode = await resolvePartnerModeForBackgroundPost();
  const url = `${base}/vendor/jobs/${encodeURIComponent(orderId.trim())}/location`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Decory-Partner-Mode': partnerMode,
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new BackgroundLocationPostError(
      response.status,
      text.slice(0, 200) || response.statusText,
    );
  }

  const json = (await response.json()) as { data?: BackgroundLocationPostResult };
  return json.data ?? (json as BackgroundLocationPostResult);
}

export function logBackgroundLocationPostError(err: unknown): void {
  if (!__DEV__) return;
  if (err instanceof BackgroundLocationPostError) {
    console.warn(
      `[en-route-location] POST failed (${err.status}): ${err.message}`,
    );
    return;
  }
  console.warn('[en-route-location] POST failed:', err);
}
