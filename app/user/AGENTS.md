# DeccorBuddys user app — agent notes

Before changing code in `app/user`:

- **Layout (same as `app/vendor`):** `app/` routes; `api/*.api.ts` + `api/client.ts`; features in `module/*`; `@/` → project root.
1. Read **[Design/CONTEXT.md](Design/CONTEXT.md)** — current slice, module map, history, out-of-scope.
2. Apply **[Design/taste.md](Design/taste.md)** only for anti-slop / brand discipline — it targets marketing sites, not full product UI. **User app is native mobile**, not a copy of web chrome: bottom nav uses **neutral black/grey tabs** (Home, Category, Instant, Profile). Use `app/web` for **content** (rails, pricing, categories); use `app/vendor` for onboarding/shell patterns. Dev on **real device + dev build**, not Expo Go.

After finishing a slice, update **Current slice**, **Module map**, **Screen inventory**, and append one line to **History** in `Design/CONTEXT.md`.
