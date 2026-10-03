const MAPS_PIN_ICON_URL =
  "https://ik.imagekit.io/aevhlnk0h/placeholder.png?updatedAt=1789971373748";

export function MapsPinIcon({ className, size = 20, ...props }) {
  return (
    <img
      src={MAPS_PIN_ICON_URL}
      alt=""
      width={size}
      height={size}
      className={className}
      {...props}
    />
  );
}
