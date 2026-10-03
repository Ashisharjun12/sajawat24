export const CROP_PRESETS = [
  { id: "free", label: "Free" },
  { id: "banner", label: "Banner", aspect: 16 / 9, outputWidth: 1920, outputHeight: 1080 },
  { id: "product", label: "Product", aspect: 1, outputWidth: 1200, outputHeight: 1200 },
];

export function getCropPreset(id) {
  return CROP_PRESETS.find((preset) => preset.id === id) ?? CROP_PRESETS[0];
}
