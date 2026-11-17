/**
 * PDP booking buttons as 3D key-caps (user app parity), same look as the "Book a slot" /
 * "Instant" cards: a solid face on a 4px darker edge (hard bottom box-shadow). Pressing sinks
 * the face 3px onto the edge. Each class overrides the button variant (`cta` / `instant`);
 * tailwind-merge drops the clashing classes.
 */

/** "Book your setup" / "Book Now": yellow #FACC15 face, #CA8A04 edge, dark brown text. */
export const PDP_BOOK_SLOT_BUTTON_CLASS =
  "border-transparent border-t-white/45 bg-[#FACC15] text-[#422006] shadow-[0_4px_0_0_#CA8A04] hover:bg-[#FDE047] hover:text-[#422006] active:translate-y-[3px] active:scale-100 active:shadow-[0_1px_0_0_#CA8A04] disabled:shadow-none";

/** "Book instant": crimson face, deep crimson #9F1239 edge, white text. */
export const PDP_BOOK_INSTANT_BUTTON_CLASS =
  "border-transparent border-t-white/45 bg-instant text-instant-foreground shadow-[0_4px_0_0_#9F1239] hover:bg-[color-mix(in_oklch,var(--instant),white_8%)] hover:text-instant-foreground active:translate-y-[3px] active:scale-100 active:shadow-[0_1px_0_0_#9F1239] disabled:shadow-none";
