import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CMS_WEBSITE_PLATFORMS } from "@/module/cms/lib/cms-constants"

export function PlatformCheckboxes({ value = [], onChange, options = CMS_WEBSITE_PLATFORMS }) {
  function toggle(platform) {
    const next = value.includes(platform)
      ? value.filter((item) => item !== platform)
      : [...value, platform]
    onChange(next.length ? next : [platform])
  }

  return (
    <div className="flex flex-wrap gap-4">
      {options.map((platform) => (
        <label key={platform} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={value.includes(platform)}
            onCheckedChange={() => toggle(platform)}
          />
          <Label className="font-normal capitalize">{platform}</Label>
        </label>
      ))}
    </div>
  )
}
