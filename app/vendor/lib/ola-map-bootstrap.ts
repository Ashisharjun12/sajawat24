import { applyOlaMapAuth } from '@/module/geo/lib/ola-map-auth';
import { loadMapsSdkConfig } from '@/module/geo/hooks/use-maps-sdk-config';
import { LogManager, NetworkManager } from '@maplibre/maplibre-react-native';
import { AppState, type AppStateStatus } from 'react-native';

let installed = false;

function suppressNoisyMapLogs() {
  LogManager.onLog((log) => {
    const message = log.message ?? '';
    if (
      message.includes('Failed to load glyph') &&
      (message.includes('Unable to resolve host') ||
        message.includes('No address associated with hostname'))
    ) {
      return true;
    }
    if (
      message.includes('Failed to load source') &&
      (message.includes('Unable to resolve host') ||
        message.includes('No address associated with hostname'))
    ) {
      return true;
    }
    if (message.includes('openmaptiles') && message.includes('Unable to resolve host')) {
      return true;
    }
    if (message.includes('openmaptiles') && message.includes('No address associated with hostname')) {
      return true;
    }
    if (message.includes('stream was reset: CANCEL')) {
      return true;
    }
    if (message.includes('openmaptiles') && message.includes('timeout')) {
      return true;
    }
    if (message.includes('Failed to load source') && message.includes('timeout')) {
      return true;
    }
    if (message.includes('line dasharray requires at least two elements')) {
      return true;
    }
    return false;
  });
}

/** Call once at app startup (before any Map mounts). */
export function installOlaMapBootstrap() {
  if (installed) return;
  installed = true;

  try {
    NetworkManager.setConnected(true);
  } catch {
    // iOS: no-op
  }

  suppressNoisyMapLogs();

  void loadMapsSdkConfig()
    .then((config) => {
      applyOlaMapAuth(config);
    })
    .catch(() => {
      // maps screens will retry via useMapsSdkConfig
    });

  // Re-apply auth when returning to foreground without invalidating cache (avoids map tile CANCEL).
  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state !== 'active') return;
    void loadMapsSdkConfig()
      .then((config) => {
        applyOlaMapAuth(config);
      })
      .catch(() => undefined);
  });
}
