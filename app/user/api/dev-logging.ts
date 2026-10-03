import { devApiBaseUrl, devApiLog } from '@/lib/dev-api-log';
import axios, { type AxiosInstance } from 'axios';

type ApiEnvelope = { data?: unknown; message?: string };

let registered = false;

export function attachDevApiLogging(client: AxiosInstance): void {
  if (!__DEV__ || registered) return;
  registered = true;

  client.interceptors.request.use((config) => {
    const method = (config.method ?? 'get').toUpperCase();
    const path = config.url ?? '';
    devApiLog('request', `${method} ${path}`, {
      baseURL: devApiBaseUrl(config.baseURL),
      params: config.params,
    });
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      const path = response.config.url ?? '';
      const envelope = response.data as ApiEnvelope | undefined;
      const payload = envelope?.data;
      const hasData = payload !== undefined && payload !== null;

      devApiLog('response', `${response.status} ${path}`, {
        hasData,
        payloadKind: hasData ? typeof payload : 'empty',
      });
      return response;
    },
    (error) => {
      if (!axios.isAxiosError(error)) {
        return Promise.reject(error);
      }

      const path = error.config?.url ?? '';
      if (!error.response) {
        devApiLog('error', `no response · ${path}`, {
          code: error.code,
          message: error.message,
          baseURL: devApiBaseUrl(error.config?.baseURL),
        });
      } else {
        const body = error.response.data as ApiEnvelope | undefined;
        devApiLog('error', `${error.response.status} · ${path}`, {
          apiMessage: body?.message,
        });
      }
      return Promise.reject(error);
    },
  );
}
