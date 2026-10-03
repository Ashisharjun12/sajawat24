import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { HomeCityCard } from "@/module/home/components/HomeCityCard";
import { useLocationStore } from "@/store/location.store";

export function ServiceCitiesPage() {
  const navigate = useNavigate();
  const cities = useLocationStore((s) => s.cities);
  const setLocation = useLocationStore((s) => s.setLocation);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (city) =>
        city.name.toLowerCase().includes(q) ||
        (city.state ?? "").toLowerCase().includes(q),
    );
  }, [cities, query]);

  function selectCity(city) {
    setLocation({ city, pincode: null, source: "manual" });
    navigate("/");
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 md:px-8 md:py-12">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          {" / "}
          Cities we serve
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          Cities we serve
        </h1>
        <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">
          Choose a city to see local pricing and available decoration setups.
        </p>
      </div>

      <div className="relative mb-8 max-w-md">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city or state"
          className="pl-9"
          aria-label="Search cities"
        />
      </div>

      {cities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No serviceable cities yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cities match your search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((city, index) => (
            <HomeCityCard
              key={city.id}
              city={city}
              index={index}
              onSelect={selectCity}
            />
          ))}
        </div>
      )}
    </div>
  );
}
