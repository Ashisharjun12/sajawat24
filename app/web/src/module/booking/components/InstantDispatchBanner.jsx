const DISPATCH_COPY = {
  idle: "We will find a decorator for you shortly.",
  searching: "Finding the nearest available decorator…",
  offering: "Waiting for a decorator to accept your booking…",
  accepted: "A decorator accepted your booking.",
  exhausted: "We could not find a decorator automatically. Our team will follow up.",
  cancelled: "Dispatch was cancelled.",
};

export function InstantDispatchBanner({ order }) {
  if (order?.fulfillmentType !== "instant") return null;
  if (!["CONFIRMED", "ASSIGNED"].includes(order.status)) return null;

  const key = order.dispatchStatus || "idle";
  const message = DISPATCH_COPY[key] ?? DISPATCH_COPY.idle;
  if (!message) return null;

  return (
    <p className="rounded-2xl bg-violet-500/10 px-4 py-3 text-sm text-foreground">{message}</p>
  );
}
