/**
 * Inline MapLibre styles using Carto raster tiles.
 * More reliable than OpenFreeMap vector styles when tile CDN fails in-browser.
 * No API key required.
 */
function rasterStyle(tiles, attribution) {
  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles,
        tileSize: 256,
        attribution,
        maxzoom: 20,
      },
    },
    layers: [
      {
        id: "basemap",
        type: "raster",
        source: "basemap",
      },
    ],
  }
}

/** Country borders + city labels (light). */
export const MAP_STYLE_LIGHT = rasterStyle(
  [
    "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
    "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
  ],
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
)

/** Dark basemap with borders. */
export const MAP_STYLE_DARK = rasterStyle(
  [
    "https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png",
    "https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png",
  ],
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
)
