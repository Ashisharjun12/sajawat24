import { HomeProductRail } from "@/module/home/components/HomeProductRail";

export function HomeProductRails({ sections = [], loading = false }) {
  if (!loading && sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-10 md:space-y-12">
      {loading && sections.length === 0 ? (
        <HomeProductRail
          section={{ slug: "loading", name: "Popular setups", items: [] }}
          loading
        />
      ) : (
        sections.map((section) => (
          <HomeProductRail key={section.id ?? section.slug} section={section} loading={loading} />
        ))
      )}
    </div>
  );
}
