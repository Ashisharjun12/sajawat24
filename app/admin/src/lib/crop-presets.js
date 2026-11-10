/**
 * Recommended upload sizes. Single source of truth for the Media info popup
 * and the Optimize dialog presets, so the numbers can never drift apart.
 *
 * `aspect` is width / height. `output*` is the target size in px.
 */
export const IMAGE_SIZES = [
  {
    id: "product",
    label: "Product",
    guideLabel: "Product image",
    aspect: 1,
    ratioLabel: "1:1",
    outputWidth: 1500,
    outputHeight: 1500,
    note: "Square. Minimum 1000 × 1000. Keep the product in the middle 75–80%.",
  },
  {
    id: "banner-mobile",
    label: "Banner mobile",
    guideLabel: "Banner, mobile",
    aspect: 2,
    ratioLabel: "2:1",
    outputWidth: 1440,
    outputHeight: 720,
    note: "Minimum 1080 × 540. The whole image is shown, not cropped.",
  },
  {
    id: "banner-pc",
    label: "Banner PC",
    guideLabel: "Banner, PC",
    aspect: 16 / 5,
    ratioLabel: "16:5",
    outputWidth: 1920,
    outputHeight: 600,
    note: "Edges can be cropped, so keep text and the main subject in the center.",
  },
  {
    id: "category",
    label: "Category",
    guideLabel: "Category image",
    aspect: 1,
    ratioLabel: "1:1",
    outputWidth: 600,
    outputHeight: 600,
    note: "Square.",
  },
]

export const CROP_PRESETS = [{ id: "free", label: "Free" }, ...IMAGE_SIZES]

export function getCropPreset(id) {
  return CROP_PRESETS.find((preset) => preset.id === id) ?? CROP_PRESETS[0]
}
