import { useSocket } from '@/providers/socket-provider';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

function toAppState(status: AppStateStatus): 'foreground' | 'background' {
  return status === 'active' ? 'foreground' : 'background';
}

export function useAppSessionState() {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const emit = (status: AppStateStatus) => {
      socket.emit('app:state', { state: toAppState(status) });
    };

    emit(AppState.currentState);
    const sub = AppState.addEventListener('change', emit);
    return () => sub.remove();
  }, [socket]);
}
