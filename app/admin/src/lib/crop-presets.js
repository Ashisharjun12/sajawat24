export const CROP_PRESETS = [
  { id: "free", label: "Free" },
  { id: "banner", label: "Banner", aspect: 16 / 9, outputWidth: 1920, outputHeight: 1080 },
  // Matches the user app home banner (full width, 2:1).
  { id: "app-banner", label: "App banner (1080×540)", aspect: 2, outputWidth: 1080, outputHeight: 540 },
  { id: "product", label: "Product", aspect: 1, outputWidth: 1200, outputHeight: 1200 },
];

export function getCropPreset(id) {
  return CROP_PRESETS.find((preset) => preset.id === id) ?? CROP_PRESETS[0];
}
