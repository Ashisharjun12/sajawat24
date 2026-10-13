import { Link } from "react-router-dom";
import { useLocationStore } from "@/store/location.store";
import { Reveal } from "@/module/home/components/Reveal";
import { HomeCityCard, HomeCityViewAllCard } from "@/module/home/components/HomeCityCard";
import { useMediaMdDown } from "@/module/catalog/hooks/use-media-md-down";

/** Desktop 3×3: 8 cities + “View all”. Mobile 2×4: 7 cities + “View all”. */
export const HOME_CITY_GRID_MAX = 8;
export const HOME_CITY_GRID_MAX_MOBILE = 7;

export function PopularCities() {
  const cities = useLocationStore((s) => s.cities);
  const setLocation = useLocationStore((s) => s.setLocation);
  const isMobile = useMediaMdDown();

  if (cities.length === 0) {
    return null;
  }

  const gridMax = isMobile ? HOME_CITY_GRID_MAX_MOBILE : HOME_CITY_GRID_MAX;
  const showViewAllCard = cities.length > gridMax;
  const previewCount = showViewAllCard ? gridMax : cities.length;
  const preview = cities.slice(0, previewCount);

  return (
    <Reveal className="mx-auto max-w-[1240px] px-4 py-16 md:px-8">
      <div className="mb-8 text-center">
        <span className="mb-0.5 block text-[13px] font-bold tracking-wide text-primary italic uppercase md:text-sm">
          wherever you&apos;re celebrating
        </span>
        <h2 className="font-heading text-[clamp(1.625rem,3vw,2.25rem)] font-extrabold tracking-tight">
          Serving in{" "}
          <span className="text-primary">your city</span>
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {preview.map((city) => (
          <HomeCityCard
            key={city.id}
            city={city}
            onSelect={(next) =>
              setLocation({ city: next, pincode: null, source: "manual" })
            }
          />
        ))}
        {showViewAllCard ? (
          <Link to="/cities" className="block min-w-0">
            <HomeCityViewAllCard />
          </Link>
        ) : null}
      </div>
    </Reveal>
  );
}
