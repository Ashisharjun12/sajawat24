const DEFAULT_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 60000,
};

const ERROR_MESSAGES = {
  1: "Location permission denied",
  2: "Location unavailable",
  3: "Location request timed out",
};

export function getDeviceCoords(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(ERROR_MESSAGES[error.code] || "Could not get location"));
      },
      { ...DEFAULT_OPTIONS, ...options },
    );
  });
}
