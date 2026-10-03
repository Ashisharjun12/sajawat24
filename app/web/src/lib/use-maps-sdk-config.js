import { useEffect, useState } from "react";
import { fetchMapsSdkConfig } from "@/api/maps.api";

let cachedConfig = null;
let inflight = null;

export function loadMapsSdkConfig() {
  if (cachedConfig) {
    return Promise.resolve(cachedConfig);
  }
  if (!inflight) {
    inflight = fetchMapsSdkConfig()
      .then((config) => {
        cachedConfig = config;
        return config;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useMapsSdkConfig() {
  const [state, setState] = useState(() => ({
    config: cachedConfig,
    loading: !cachedConfig,
    error: null,
  }));

  useEffect(() => {
    if (cachedConfig) return;

    let cancelled = false;
    void loadMapsSdkConfig()
      .then((config) => {
        if (!cancelled) {
          setState({ config, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({ config: null, loading: false, error });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
