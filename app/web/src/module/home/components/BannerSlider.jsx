import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DecoryImageFallback } from "@/components/decory-image-fallback";
import { bannerImageForViewport, hasBannerOverlay } from "@/module/cms/lib/banner-slide";
const AUTOPLAY_MS = 6000;

function SlideImage({ src, alt, className, mobileHero, mobileHeroContain }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return <DecoryImageFallback />;
  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        "absolute inset-0 size-full",
        mobileHeroContain
          ? "object-contain object-center"
          : mobileHero
            ? "object-cover object-center"
            : "object-contain md:object-cover",
        className,
      )}
      onError={() => setBroken(true)}
    />
  );
}

function SlideOverlay({ item, mobileHero }) {
  if (mobileHero || !hasBannerOverlay(item)) return null;

  return (
    <>
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent md:bg-linear-to-r md:from-black/92 md:via-black/55 md:to-transparent" />
      <div className="relative z-10 flex h-full max-w-[640px] flex-col justify-end px-4 pb-8 md:justify-center md:px-16 md:pb-0">
        {item.tag ? (
          <span className="mb-1.5 inline-flex w-fit items-center rounded-[14px] bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white md:mb-[18px] md:px-[13px] md:py-1.5 md:text-xs">
            {item.tag}
          </span>
        ) : null}
        {item.title ? (
          <h1 className="font-heading text-[1.35rem] leading-[1.15] font-extrabold tracking-tight text-white md:text-[clamp(1.85rem,4.2vw,2.875rem)]">
            {item.title}
          </h1>
        ) : null}
        {item.subtitle ? (
          <p className="mt-4 mb-6 hidden max-w-[460px] text-[15px] leading-[1.65] text-white/75 md:block">
            {item.subtitle}
          </p>
        ) : null}
        {item.ctaLabel ? (
          <div className="mt-3 hidden md:mt-0 md:flex md:flex-wrap md:items-center md:gap-4">
            <Button
              className="h-11 rounded-[22px] px-6 text-sm font-semibold"
              nativeButton={false}
              render={<Link to={item.href ?? "/decorations"} />}
            >
              {item.ctaLabel}
            </Button>
            {item.secondaryLabel ? (
              <Button
                variant="outline"
                className="h-11 rounded-[22px] border-white/25 bg-transparent px-5 text-sm font-medium text-white hover:bg-white/10 hover:text-white"
                nativeButton={false}
                render={<Link to={item.secondaryHref ?? "/decorations"} />}
              >
                {item.secondaryLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}

function ImageOnlySlide({ item, mobileHero, mobileHeroContain }) {
  const image = (
    <SlideImage
      src={bannerImageForViewport(item, mobileHero)}
      alt={item.alt}
      mobileHero={mobileHero}
      mobileHeroContain={mobileHeroContain}
    />
  );
  if (item.href) {
    return (
      <Link to={item.href} className="absolute inset-0 block size-full" aria-label={item.alt}>
        {image}
      </Link>
    );
  }
  return image;
}

function slideShellClass(variant) {
  if (variant === "mobileHeroFull") {
    return "relative aspect-[16/9] w-full max-w-none overflow-hidden rounded-2xl bg-muted/50";
  }
  if (variant === "mobileHero") {
    return "relative h-[160px] w-full max-w-none overflow-hidden rounded-2xl bg-background shadow-md ring-1 ring-background/80";
  }
  return "relative aspect-[16/5] max-h-[200px] overflow-hidden rounded-[22px] border border-border bg-black md:max-h-none md:aspect-[16/5]";
}

function SlideFrame({ item, children, variant }) {
  const imageOnly = !hasBannerOverlay(item);
  const mobileHero =
    variant === "mobileHero" || variant === "mobileHeroFull";
  const mobileHeroContain = variant === "mobileHeroFull";
  return (
    <div className={slideShellClass(variant)}>
      {imageOnly ? (
        <ImageOnlySlide
          item={item}
          mobileHero={mobileHero}
          mobileHeroContain={mobileHeroContain}
        />
      ) : (
        <SlideImage
          src={bannerImageForViewport(item, mobileHero)}
          alt={item.alt}
          mobileHero={mobileHero}
          mobileHeroContain={mobileHeroContain}
        />
      )}
      {children}
    </div>
  );
}

export function BannerSlider({ slides = [], variant }) {
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides?.length ?? 0;

  useEffect(() => {
    if (reduceMotion || paused || total < 2) return undefined;
    const id = window.setInterval(() => {
      setCurrent((index) => (index + 1) % total);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, total, current]);

  if (!total) return null;

  if (total === 1) {
    const item = slides[0];
    return (
      <SlideFrame item={item} variant={variant}>
        <SlideOverlay
          item={item}
          mobileHero={
            variant === "mobileHero" || variant === "mobileHeroFull"
          }
        />
      </SlideFrame>
    );
  }

  function go(next) {
    setCurrent((next + total) % total);
  }

  const currentSlide = slides[current];
  const dotFillClass = hasBannerOverlay(currentSlide) ? "bg-white" : "bg-white";
  const mobileHero =
    variant === "mobileHero" || variant === "mobileHeroFull";
  const mobileHeroContain = variant === "mobileHeroFull";

  return (
    <div
      className={slideShellClass(variant)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-[600ms] ease-in-out",
            index === current ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none",
          )}
          aria-hidden={index !== current}
        >
          {hasBannerOverlay(item) ? (
            <SlideImage
              src={bannerImageForViewport(item, mobileHero)}
              alt={item.alt}
              mobileHero={mobileHero}
              mobileHeroContain={mobileHeroContain}
            />
          ) : (
            <ImageOnlySlide
              item={item}
              mobileHero={mobileHero}
              mobileHeroContain={mobileHeroContain}
            />
          )}
          <SlideOverlay item={item} mobileHero={mobileHero} />
        </div>
      ))}

      {total > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            className="absolute top-1/2 left-5 z-30 hidden size-[38px] -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white hover:bg-black/55 md:flex"
            onClick={() => go(current - 1)}
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className="absolute top-1/2 right-5 z-30 hidden size-[38px] -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white hover:bg-black/55 md:flex"
            onClick={() => go(current + 1)}
          >
            <ChevronRightIcon className="size-4" />
          </button>
          <div className="absolute bottom-3 left-4 z-30 flex gap-2 md:bottom-7 md:left-16">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === current}
                className="h-[3px] w-[26px] overflow-hidden rounded-sm bg-white/20"
                onClick={() => go(index)}
              >
                <span
                  key={`${current}-${index}-${paused}`}
                  className={cn(
                    "block h-full origin-left",
                    dotFillClass,
                    index < current && "scale-x-100",
                    index === current && !reduceMotion && !paused
                      ? "animate-[banner-fill_6s_linear_forwards]"
                      : index === current
                        ? "scale-x-100"
                        : "scale-x-0",
                  )}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
