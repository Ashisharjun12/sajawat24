/**
 * "Book your setup" / "Book Now" (scheduled booking) = same yellow 3D key-cap as the
 * "Book a slot" card: #FACC15 face on a 4px #CA8A04 edge, dark brown text. Pressing sinks the
 * face onto the edge. Overrides the orange `cta` variant (tailwind-merge drops the clashing
 * classes). Instant keeps the crimson `instant` variant.
 */
export const PDP_BOOK_SLOT_BUTTON_CLASS =
  "border-transparent border-t-white/45 bg-[#FACC15] text-[#422006] shadow-[0_4px_0_0_#CA8A04] hover:bg-[#FDE047] hover:text-[#422006] active:translate-y-[3px] active:scale-100 active:shadow-[0_1px_0_0_#CA8A04] disabled:shadow-none";
