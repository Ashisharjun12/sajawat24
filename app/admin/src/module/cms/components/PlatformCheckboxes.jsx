import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CMS_PLATFORM_LABELS, CMS_WEBSITE_PLATFORMS } from "@/module/cms/lib/cms-constants"

export function PlatformCheckboxes({
  value = [],
  onChange,
  options = CMS_WEBSITE_PLATFORMS,
  labels = CMS_PLATFORM_LABELS,
  allowEmpty = false,
}) {
  function toggle(platform) {
    const next = value.includes(platform)
      ? value.filter((item) => item !== platform)
      : [...value, platform]
    if (!allowEmpty && next.length === 0) return
    onChange(next)
  }

  function labelFor(platform) {
    return labels[platform] ?? platform
  }

  return (
    <div className="flex flex-wrap gap-4">
      {options.map((platform) => (
        <label key={platform} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={value.includes(platform)}
            onCheckedChange={() => toggle(platform)}
          />
          <Label className="font-normal">{labelFor(platform)}</Label>
        </label>
      ))}
    </div>
  )
}
