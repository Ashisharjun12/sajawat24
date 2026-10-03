import { useCallback, useEffect, useRef, useState } from "react";
import { QuoteIcon, StarIcon } from "lucide-react";
import { getLenis } from "@/lib/lenis-instance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Reveal } from "@/module/home/components/Reveal";

const START_LAYOUT = [
  { x: -240, y: -60, rot: -6 },
  { x: -10, y: -110, rot: 3 },
  { x: 220, y: -50, rot: 7 },
  { x: -170, y: 120, rot: -4 },
  { x: 50, y: 150, rot: -2 },
  { x: 270, y: 120, rot: 5 },
];

const BASE_W = 896;
const CARD_W = 280;
const CARD_H = 230;

function initials(name = "") {
  const parts = name.replace(/&/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "D";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          className={
            index < rating
              ? "size-3.5 fill-amber-400 text-amber-400"
              : "size-3.5 text-white/25"
          }
        />
      ))}
    </div>
  );
}

function QuoteCardBody({ data }) {
  return (
    <>
      <QuoteIcon className="mb-3 size-7 text-white/30" strokeWidth={2.5} />
      <p className="mb-5 text-sm leading-snug text-white/95">
        &ldquo;{data.quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <Avatar size="lg" className="ring-2 ring-white/20">
          <AvatarImage src={data.avatar} alt="" draggable={false} />
          <AvatarFallback className="bg-white/15 text-xs text-white">
            {initials(data.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{data.name}</div>
          <div className="truncate text-xs text-white/60">{data.role}</div>
          <div className="mt-1">
            <StarRow rating={data.rating} />
          </div>
        </div>
      </div>
    </>
  );
}

function MobileQuoteCard({ data }) {
  return (
    <article
      className="flex w-[min(88vw,320px)] shrink-0 snap-center flex-col rounded-2xl p-5 shadow-2xl shadow-black/50 ring-1 ring-white/10"
      style={{ backgroundColor: data.accent }}
    >
      <QuoteCardBody data={data} />
    </article>
  );
}

function DraggableCard({ data, layout, z, bringToFront, stageRef, cardW, cardH }) {
  const [pos, setPos] = useState({ x: layout.x, y: layout.y });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!dragging.current) {
      setPos({ x: layout.x, y: layout.y });
    }
  }, [layout.x, layout.y]);

  const clamp = useCallback(
    (x, y) => {
      const stage = stageRef.current;
      if (!stage) return { x, y };
      const rect = stage.getBoundingClientRect();
      const maxX = rect.width / 2 - cardW / 2;
      const maxY = rect.height / 2 - cardH / 2;
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [stageRef, cardW, cardH],
  );

  const onPointerDown = useCallback(
    (event) => {
      bringToFront(data.id);
      dragging.current = true;
      offset.current = { x: event.clientX - pos.x, y: event.clientY - pos.y };
      event.currentTarget.setPointerCapture(event.pointerId);
      getLenis()?.stop();
    },
    [pos, data.id, bringToFront],
  );

  const onPointerMove = useCallback(
    (event) => {
      if (!dragging.current) return;
      setPos(
        clamp(event.clientX - offset.current.x, event.clientY - offset.current.y),
      );
    },
    [clamp],
  );

  const onPointerUp = useCallback((event) => {
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    getLenis()?.start();
  }, []);

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: cardW,
        minHeight: cardH,
        transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) rotate(${layout.rot}deg)`,
        zIndex: z,
        backgroundColor: data.accent,
        touchAction: "none",
      }}
      className="cursor-grab select-none rounded-2xl p-5 shadow-2xl shadow-black/50 ring-1 ring-white/10 active:cursor-grabbing md:p-6"
    >
      <QuoteCardBody data={data} />
    </div>
  );
}

export function HostQuotes({ reviews = [] }) {
  const items = reviews ?? [];
  const [order, setOrder] = useState(() => items.map((review) => review.id));

  useEffect(() => {
    setOrder((reviews ?? []).map((review) => review.id));
  }, [reviews]);

  const [scale, setScale] = useState(1);
  const stageRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    function measure() {
      const width = stage.getBoundingClientRect().width;
      setScale(Math.min(1, Math.max(0.42, width / BASE_W)));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const bringToFront = useCallback((id) => {
    setOrder((prev) => [...prev.filter((item) => item !== id), id]);
  }, []);

  const cardW = Math.round(CARD_W * Math.min(1, scale + 0.12));
  const cardH = Math.round(CARD_H * Math.min(1, scale + 0.12));

  if (!items.length) return null;

  return (
    <Reveal className="mx-auto max-w-[1240px] px-4 py-12 md:px-8 md:py-16">
      <div className="flex w-full flex-col items-center overflow-hidden rounded-3xl bg-zinc-950 py-8 md:py-10">
        <span className="mb-1 block text-[13px] font-bold tracking-wide text-primary italic uppercase">
          said by actual hosts
        </span>
        <h2 className="font-heading px-4 text-center text-[clamp(1.625rem,3vw,2.25rem)] font-extrabold tracking-tight text-white">
          What they say about us
        </h2>
        <p className="mb-2 text-sm text-white/40 md:hidden">Swipe to read more</p>
        <p className="mb-2 hidden text-sm text-white/40 md:block">Drag the cards around</p>

        <div
          className="flex w-full gap-4 overflow-x-auto overscroll-x-contain px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:hidden snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          aria-label="Host testimonials"
        >
          {items.map((review) => (
            <MobileQuoteCard key={review.id} data={review} />
          ))}
        </div>

        <div
          ref={stageRef}
          className="relative hidden w-full max-w-4xl md:block"
          style={{ height: scale < 0.7 ? 460 : 620 }}
        >
          {items.map((review, index) => {
            const start = START_LAYOUT[index] ?? START_LAYOUT[0];
            return (
              <DraggableCard
                key={review.id}
                data={review}
                layout={{
                  x: start.x * scale,
                  y: start.y * scale,
                  rot: start.rot,
                }}
                z={order.indexOf(review.id)}
                bringToFront={bringToFront}
                stageRef={stageRef}
                cardW={cardW}
                cardH={cardH}
              />
            );
          })}
        </div>
      </div>
    </Reveal>
  );
}
