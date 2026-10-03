import { Link } from "react-router-dom";
import { useLocationStore } from "@/store/location.store";
import { Reveal } from "@/module/home/components/Reveal";
import { HomeCityCard } from "@/module/home/components/HomeCityCard";

export const HOME_CITY_PREVIEW_COUNT = 5;

export function PopularCities() {
  const cities = useLocationStore((s) => s.cities);
  const setLocation = useLocationStore((s) => s.setLocation);

  if (cities.length === 0) {
    return null;
  }

  const preview = cities.slice(0, HOME_CITY_PREVIEW_COUNT);
  const showViewAll = cities.length > HOME_CITY_PREVIEW_COUNT;

  return (
    <Reveal className="mx-auto max-w-[1240px] px-4 py-16 md:px-8">
      <div className="mb-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1">
          <div>
            <span className="mb-0.5 block text-[15px] font-bold tracking-wide text-amber-800 italic uppercase dark:text-primary">
              wherever you&apos;re celebrating
            </span>
            <h2 className="font-heading text-[clamp(1.625rem,3vw,2.25rem)] font-extrabold tracking-tight">
              Popular in your city
            </h2>
            <p className="mt-2 max-w-[460px] text-[15px] text-muted-foreground">
              Pick a city to price the catalog. Setups stay the same; the rate is local.
            </p>
          </div>
          {showViewAll ? (
            <Link
              to="/cities"
              className="shrink-0 self-center whitespace-nowrap pt-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
            >
              View all →
            </Link>
          ) : null}
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {preview.map((city, index) => (
          <div key={city.id} className="w-[210px] shrink-0">
            <HomeCityCard
              city={city}
              index={index}
              onSelect={(next) =>
                setLocation({ city: next, pincode: null, source: "manual" })
              }
            />
          </div>
        ))}
      </div>
    </Reveal>
  );
}
