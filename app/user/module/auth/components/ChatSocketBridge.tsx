import { useAppSessionState } from '@/module/chat/hooks/use-app-session-state';
import { useAuthStore } from '@/store/auth.store';

/** Emits app foreground/background for chat presence when logged in. */
export function ChatSocketBridge() {
  const accessToken = useAuthStore((s) => s.accessToken);
  useAppSessionState();
  if (!accessToken) return null;
  return null;
}
