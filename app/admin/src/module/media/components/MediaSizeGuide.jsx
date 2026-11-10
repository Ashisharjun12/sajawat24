import { InfoIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

import { IMAGE_SIZES } from "@/lib/crop-presets"

/** Info button: click to see the recommended upload size for each image type. */
export function MediaSizeGuide() {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Recommended image sizes"
      >
        <InfoIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] gap-3">
        <PopoverHeader>
          <PopoverTitle>Recommended image sizes</PopoverTitle>
          <PopoverDescription>Upload at these sizes so images fit mobile and PC screens.</PopoverDescription>
        </PopoverHeader>
        <ul className="flex flex-col gap-2.5">
          {IMAGE_SIZES.map((row) => (
            <li key={row.id} className="text-xs leading-relaxed">
              <p className="font-medium text-foreground">
                {row.guideLabel}:{" "}
                <span className="text-primary">
                  {row.outputWidth} × {row.outputHeight} px
                </span>{" "}
                <span className="font-normal text-muted-foreground">({row.ratioLabel})</span>
              </p>
              <p className="text-muted-foreground">{row.note}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">All images: JPG or WebP, under about 300 KB.</p>
      </PopoverContent>
    </Popover>
  )
}
