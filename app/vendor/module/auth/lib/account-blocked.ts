import axios from 'axios';

const PAUSED_MESSAGES = [
  'account blocked',
  'vendor account is blocked',
  'vendor account is not active',
  'shop is not active',
];

export function isPlatformAccessPausedMessage(message: unknown): boolean {
  if (typeof message !== 'string' || !message.trim()) return false;
  const lower = message.toLowerCase();
  return PAUSED_MESSAGES.some((fragment) => lower.includes(fragment));
}

export function isPlatformAccessPausedError(err: unknown): boolean {
  if (!axios.isAxiosError(err) || !err.response) return false;
  const status = err.response.status;
  if (status !== 403 && status !== 401) return false;
  const message = err.response.data?.message;
  return isPlatformAccessPausedMessage(message);
}
