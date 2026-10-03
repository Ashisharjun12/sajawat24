const DEFAULT_MAP_PIN_ICON_URL = "https://ik.imagekit.io/aevhlnk0h/placeholder.png";

export function getMapPinIconUrl() {
  const url = import.meta.env.VITE_MAP_PIN_ICON_URL?.trim();
  return url || DEFAULT_MAP_PIN_ICON_URL;
}
