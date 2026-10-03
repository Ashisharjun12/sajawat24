import type { PublicCity } from '@/api/geo.api';

export function getCitiesByState(state: string, cities: PublicCity[]) {
  return cities
    .filter((city) => city.state === state)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getCityById(cityId: string, cities: PublicCity[]) {
  return cities.find((city) => city.id === cityId) ?? null;
}

export function getStatesFromCities(cities: PublicCity[]) {
  return [...new Set(cities.map((city) => city.state))].sort((a, b) => a.localeCompare(b));
}
