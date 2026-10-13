import {
  CameraIcon,
  MessageCircleIcon,
  PlayIcon,
  Share2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_ICONS = {
  instagram: CameraIcon,
  facebook: Share2Icon,
  youtube: PlayIcon,
  whatsapp: MessageCircleIcon,
  x: Share2Icon,
  linkedin: Share2Icon,
};

export function SocialIconLink({ link, className }) {
  const PresetIcon = link.iconPreset ? PRESET_ICONS[link.iconPreset] : null;

  return (
    <a
      href={link.href}
      className={cn("text-foreground/80 transition-colors hover:text-foreground", className)}
      aria-label={link.label}
      target={link.href.startsWith("http") ? "_blank" : undefined}
      rel={link.href.startsWith("http") ? "noreferrer" : undefined}
    >
      {link.iconUrl ? (
        <img src={link.iconUrl} alt="" className="size-4 object-contain" />
      ) : PresetIcon ? (
        <PresetIcon className="size-4" />
      ) : (
        <Share2Icon className="size-4" />
      )}
    </a>
  );
}
