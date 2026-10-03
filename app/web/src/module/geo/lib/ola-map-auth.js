const OLA_HOST = "api.olamaps.io";

/** MapLibre transformRequest — required for OAuth tile auth (fixes blank/white web maps). */
export function buildOlaMapInitOptions(sdkConfig) {
  if (!sdkConfig) return {};

  const transformRequest = (url) => {
    if (!url.includes(OLA_HOST)) {
      return { url };
    }

    if (sdkConfig.authMode === "oauth" && sdkConfig.accessToken) {
      return {
        url,
        headers: {
          Authorization: `Bearer ${sdkConfig.accessToken}`,
        },
      };
    }

    if (sdkConfig.apiKey && !url.includes("api_key=")) {
      const join = url.includes("?") ? "&" : "?";
      return {
        url: `${url}${join}api_key=${encodeURIComponent(sdkConfig.apiKey)}`,
      };
    }

    return { url };
  };

  return { transformRequest };
}
