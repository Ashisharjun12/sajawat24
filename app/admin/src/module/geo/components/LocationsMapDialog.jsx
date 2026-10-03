import { useEffect, useMemo, useRef, useState } from "react"
import { MapPinIcon } from "lucide-react"
import Map, { Marker, Popup } from "react-map-gl/maplibre"
import "maplibre-gl/dist/maplibre-gl.css"
import { listActive, listAdmin } from "@/api/cities.api"
import { useTheme } from "@/components/ui/theme-provider"
import { INDIA_CENTER, INDIA_STATE_COORDS } from "@/data/state-coords"
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from "@/lib/map-styles"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const INITIAL_VIEW = {
  latitude: INDIA_CENTER[0],
  longitude: INDIA_CENTER[1],
  zoom: 5.2,
}

function statesWithActiveCities(cities) {
  const byState = Object.create(null)

  for (const city of cities ?? []) {
    if (!city?.state) continue
    const names = byState[city.state] ?? []
    names.push(city.name)
    byState[city.state] = names
  }

  return Object.entries(byState)
    .map(([state, cityNames]) => ({
      state,
      cityNames: cityNames.sort((a, b) => a.localeCompare(b)),
      latitude: INDIA_STATE_COORDS[state]?.[0],
      longitude: INDIA_STATE_COORDS[state]?.[1],
    }))
    .filter((row) => row.latitude != null && row.longitude != null)
    .sort((a, b) => a.state.localeCompare(b.state))
}

async function loadActiveCities() {
  try {
    const cities = await listActive()
    if (Array.isArray(cities)) return cities
  } catch {
    // Public list can fail independently of admin routes.
  }
  const data = await listAdmin({ page: 1, limit: 100, isActive: "true" })
  return data?.items ?? []
}

export function LocationsMapDialog({ open, onOpenChange }) {
  const mapRef = useRef(null)
  const { resolvedTheme } = useTheme()
  const [markers, setMarkers] = useState([])
  const [selected, setSelected] = useState(null)

  const mapStyle = useMemo(
    () => (resolvedTheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT),
    [resolvedTheme],
  )

  useEffect(() => {
    if (!open) {
      setSelected(null)
      return
    }

    let cancelled = false

    loadActiveCities()
      .then((cities) => {
        if (!cancelled) setMarkers(statesWithActiveCities(cities))
      })
      .catch(() => {
        if (!cancelled) setMarkers([])
      })

    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function resizeMap() {
      mapRef.current?.resize()
    }

    resizeMap()
    const t1 = window.setTimeout(resizeMap, 150)
    const t2 = window.setTimeout(resizeMap, 400)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [open, markers.length, mapStyle])

  function onMapLoad() {
    mapRef.current?.resize()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Active locations</DialogTitle>
          <DialogDescription>
            States with at least one active city on the service allowlist.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <div className="locations-map-root relative h-112 min-h-112 overflow-hidden rounded-md border border-border">
            <Map
              ref={mapRef}
              key={resolvedTheme}
              initialViewState={INITIAL_VIEW}
              mapStyle={mapStyle}
              style={{ width: "100%", height: "100%" }}
              attributionControl={{ compact: true }}
              onLoad={onMapLoad}
              onClick={() => setSelected(null)}
            >
              {markers.map((marker) => (
                <Marker
                  key={marker.state}
                  latitude={marker.latitude}
                  longitude={marker.longitude}
                  anchor="bottom"
                  onClick={(event) => {
                    event.originalEvent.stopPropagation()
                    setSelected(marker)
                  }}
                >
                  <button
                    type="button"
                    aria-label={`${marker.state} locations`}
                    className="flex size-8 items-center justify-center rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110"
                  >
                    <MapPinIcon className="size-4" />
                  </button>
                </Marker>
              ))}

              {selected ? (
                <Popup
                  latitude={selected.latitude}
                  longitude={selected.longitude}
                  anchor="bottom"
                  offset={12}
                  closeButton
                  closeOnClick={false}
                  onClose={() => setSelected(null)}
                  className="locations-map-popup"
                >
                  <div className="space-y-1 p-1 text-sm">
                    <p className="font-medium">{selected.state}</p>
                    {selected.cityNames.length ? (
                      <p className="max-w-56 text-muted-foreground">
                        {selected.cityNames.join(", ")}
                      </p>
                    ) : null}
                  </div>
                </Popup>
              ) : null}
            </Map>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
