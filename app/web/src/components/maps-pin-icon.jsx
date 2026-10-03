import { MapPinIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared map pin for location / city UI (Lucide — matches app theme). */
export function MapsPinIcon({ className, size = 20, strokeWidth = 2, ...props }) {
  return (
    <MapPinIcon
      className={cn("shrink-0", className)}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden
      {...props}
    />
  );
}
