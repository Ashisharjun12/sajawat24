import {
  MOCK_APP_ANNOUNCEMENTS,
  MOCK_APP_BANNERS,
  MOCK_APP_CATEGORIES,
  MOCK_APP_RAILS,
} from "@/module/cms/lib/mock-mobile-content"
import { cn } from "@/lib/utils"

export function MobilePhonePreview({ className, dimmed = false, hero: heroOverride }) {
  const announcement = MOCK_APP_ANNOUNCEMENTS[0]
  const hero = heroOverride?.imageUrl
    ? heroOverride
    : MOCK_APP_BANNERS[0]

  return (
    <div
      className={cn(
        "mx-auto w-[280px] shrink-0 rounded-[2rem] border-[6px] border-neutral-800 bg-neutral-900 p-2 shadow-lg",
        dimmed && "opacity-60",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.4rem] bg-neutral-50">
        <div className="flex items-center justify-between px-3 py-2 text-[10px] text-neutral-500">
          <span className="font-medium text-neutral-800">9:41</span>
          <span className="truncate text-neutral-400">App preview</span>
        </div>
        <div className="border-b border-neutral-200 bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-7 flex-1 rounded-md bg-neutral-100" />
            <div className="size-7 rounded-full bg-neutral-100" />
            <div className="size-7 rounded-full bg-neutral-100" />
          </div>
          <div className="mt-2 h-8 rounded-lg bg-neutral-100" />
        </div>
        {announcement ? (
          <div className="bg-amber-50 px-2 py-1 text-center text-[9px] text-amber-900">
            {announcement.message}
          </div>
        ) : null}
        <div className="relative aspect-[16/9] w-full bg-neutral-200">
          {hero?.imageUrl ? (
            <img
              src={hero.imageUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : null}
          {hero?.href ? (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1.5 text-center">
              <p className="text-[8px] font-medium text-white">Tap banner → opens link</p>
              {hero?.linkLabel ? (
                <p className="text-[7px] text-white/80">{hero.linkLabel}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="px-2 py-2">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-medium text-neutral-800">Categories</p>
            <span className="text-[8px] text-neutral-500">View all</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {MOCK_APP_CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex w-[52px] shrink-0 flex-col items-center gap-1">
                <div className="aspect-square w-full rounded-xl bg-neutral-200" />
                <span className="w-full truncate text-center text-[8px] leading-tight text-neutral-700">
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        {MOCK_APP_RAILS.map((rail) => (
          <div key={rail.id} className="px-2 pb-3">
            <p className="mb-1.5 text-[10px] font-medium text-neutral-800">
              {rail.title}
            </p>
            <div className="flex gap-2 overflow-x-auto">
              {rail.products.map((p) => (
                <div
                  key={p.id}
                  className="w-24 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-white"
                >
                  <div className="aspect-square bg-neutral-100" />
                  <div className="p-1.5">
                    <p className="line-clamp-2 text-[8px] text-neutral-800">
                      {p.name}
                    </p>
                    <p className="text-[8px] font-medium text-neutral-900">
                      {p.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-around border-t border-neutral-200 bg-white py-2 text-[8px] text-neutral-500">
          <span>Home</span>
          <span>Category</span>
          <span>Instant</span>
          <span>Profile</span>
        </div>
      </div>
    </div>
  )
}
