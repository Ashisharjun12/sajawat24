import { DecoryImageFallback } from "@/module/catalog/components/DecoryImageFallback"
import { addonImageSrc } from "@/module/catalog/components/AddonThumb"
import { Button } from "@/components/ui/button"
import { PackageAddonPrice } from "@/module/bookings/package-picker/PackageAddonPrice"

export function PackageAddonRow({ addon, selected, onToggle }) {
  const thumb = addonImageSrc(addon)

  return (
    <li className="flex min-w-0 items-center gap-3">
      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
        {thumb ? (
          <img src={thumb} alt="" className="size-full object-cover" />
        ) : (
          <DecoryImageFallback />
        )}
      </span>
      <div className="min-w-0 flex-1">
        {addon.color?.name ? (
          <p className="flex min-w-0 items-center gap-1.5 font-medium">
            <span
              className="size-3.5 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: addon.color.hex }}
              aria-hidden
            />
            <span className="truncate">
              {addon.name} · {addon.color.name}
            </span>
          </p>
        ) : (
          <p className="truncate font-medium">{addon.name}</p>
        )}
        <PackageAddonPrice
          pricePaise={addon.pricePaise}
          compareAtPaise={addon.compareAtPaise}
        />
      </div>
      <Button
        type="button"
        size="sm"
        variant={selected ? "default" : "outline"}
        onClick={() => onToggle(addon.id)}
      >
        {selected ? "Selected" : "Select"}
      </Button>
    </li>
  )
}
