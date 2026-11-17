import { Link } from "react-router-dom";
import { MessageCircleIcon, PhoneIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeContacts } from "@/module/account/lib/order-contacts";

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Neutral grey avatar with initials (no brand colour, keeps the card calm). */
function Avatar({ name, small = false }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100",
        small ? "size-9 text-xs" : "size-12 text-sm",
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

const ACTION_CLASS =
  "inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

/** Secondary contact (vendor support): compact row with a small round call button. */
function SupportRow({ contact }) {
  return (
    <div className="flex items-center gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
      <Avatar name={contact.name} small />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{contact.role}</p>
        <p className="truncate text-sm font-medium text-foreground">{contact.name}</p>
      </div>
      {contact.phone ? (
        <a
          href={`tel:${contact.phone}`}
          aria-label={`${contact.callLabel}, ${contact.name}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-foreground transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-950"
        >
          <PhoneIcon className="size-4" />
        </a>
      ) : null}
    </div>
  );
}

/**
 * Decorator contact on booking details (phone + desktop, user app parity). Minimal grey card:
 * small role label, grey avatar + full name (2 lines, never cut short by buttons), shop name,
 * then wide Chat (white) / Call (near-black) buttons; vendor support as a compact row.
 */
export function VendorContactCard({ serviceContact, assignee, orderId, showChat = true, className }) {
  const contacts = normalizeContacts({ serviceContact, assignee });
  if (!contacts) return null;

  const { primary, vendorSupport } = contacts;
  const canCall = Boolean(primary.phone?.trim());
  const chatHref = showChat && orderId ? `/account/bookings/${orderId}/chat` : null;

  return (
    <section
      aria-label={primary.role}
      className={cn("flex flex-col gap-3 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800/70 sm:p-5", className)}
    >
      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {primary.role}
      </p>

      <div className="flex items-center gap-3">
        <Avatar name={primary.name} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-base font-semibold text-foreground">{primary.name}</p>
          {primary.detail ? (
            <p className="truncate text-sm text-muted-foreground">{primary.detail}</p>
          ) : null}
        </div>
      </div>

      {chatHref || canCall ? (
        <div className="flex gap-2">
          {chatHref ? (
            <Link
              to={chatHref}
              aria-label={`Chat with ${primary.name}`}
              className={cn(
                ACTION_CLASS,
                "bg-white text-foreground hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-950",
              )}
            >
              <MessageCircleIcon className="size-[18px] shrink-0" />
              Chat
            </Link>
          ) : null}
          {canCall ? (
            <a
              href={`tel:${primary.phone.trim()}`}
              aria-label={`${primary.callLabel}, ${primary.name}`}
              className={cn(
                ACTION_CLASS,
                "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
              )}
            >
              <PhoneIcon className="size-[18px] shrink-0" />
              Call
            </a>
          ) : null}
        </div>
      ) : null}

      {vendorSupport ? <SupportRow contact={vendorSupport} /> : null}
    </section>
  );
}
