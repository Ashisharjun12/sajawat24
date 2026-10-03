import { listCities } from "@/api/geo.api";
import {
  isBackendCityId,
  isLegacyDemoCity,
  LOCATION_PROMPT_DISMISSED_KEY,
  useLocationStore,
} from "@/store/location.store";

function shouldPrompt({ city }) {
  if (typeof sessionStorage !== "undefined") {
    if (sessionStorage.getItem(LOCATION_PROMPT_DISMISSED_KEY) === "1") {
      return false;
    }
  }

  if (!city || isLegacyDemoCity(city)) {
    return true;
  }

  if (isBackendCityId(city.id)) {
    return false;
  }

  return true;
}

export async function hydrateLocation() {
  const store = useLocationStore.getState();
  store.setStatus("loading");

  try {
    const cities = await listCities();
    store.setCities(cities);

    const { city, pincode, source } = useLocationStore.getState();
    let nextCity = city;
    let nextPincode = pincode;
    let nextSource = source;

    if (isLegacyDemoCity(city) || (city && !cities.some((item) => item.id === city.id))) {
      nextCity = cities[0] ?? null;
      nextPincode = null;
      nextSource = nextCity ? "default" : null;
    } else if (!city && cities.length > 0) {
      nextCity = cities[0];
      nextPincode = null;
      nextSource = "default";
    }

    if (nextCity !== city || nextPincode !== pincode || nextSource !== source) {
      store.setLocation({
        city: nextCity,
        pincode: nextPincode,
        source: nextSource ?? "default",
      });
    }

    store.setNeedsPrompt(shouldPrompt({ city: nextCity }));
  } catch {
    const { city } = useLocationStore.getState();
    store.setNeedsPrompt(isLegacyDemoCity(city) || !city);
  } finally {
    store.setStatus("ready");
  }
}
