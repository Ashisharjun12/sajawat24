import { fetchMapsSdkConfig, type MapsSdkConfig } from '@/api/maps.api';
import { applyOlaMapAuth } from '@/module/geo/lib/ola-map-auth';
import { useCallback, useEffect, useState } from 'react';

let cached: MapsSdkConfig | null = null;
let inflight: Promise<MapsSdkConfig> | null = null;

export function invalidateMapsSdkConfig() {
  cached = null;
  inflight = null;
}

function fetchConfig(): Promise<MapsSdkConfig> {
  if (!inflight) {
    inflight = fetchMapsSdkConfig()
      .then((config) => {
        applyOlaMapAuth(config);
        cached = config;
        return config;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function loadMapsSdkConfig(): Promise<MapsSdkConfig> {
  if (cached) return Promise.resolve(cached);
  return fetchConfig();
}

export function useMapsSdkConfig() {
  const [state, setState] = useState<{
    config: MapsSdkConfig | null;
    loading: boolean;
    error: Error | null;
  }>({
    config: cached,
    loading: !cached,
    error: null,
  });

  const load = useCallback((force = false) => {
    if (force) {
      invalidateMapsSdkConfig();
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    void fetchConfig()
      .then((config) => {
        setState({ config, loading: false, error: null });
      })
      .catch((error: unknown) => {
        setState({
          config: null,
          loading: false,
          error: error instanceof Error ? error : new Error('maps config failed'),
        });
      });
  }, []);

  useEffect(() => {
    if (cached) return;
    load(false);
  }, [load]);

  const retry = useCallback(() => {
    load(true);
  }, [load]);

  return { ...state, retry };
}
