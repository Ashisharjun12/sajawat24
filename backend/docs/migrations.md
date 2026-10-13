# Database migrations

## Rules

- **Always forward:** add a new numbered migration per change; run `npm run db:migrate` on each environment.
- **Prefer additive:** new nullable columns, new enum values (`ADD VALUE`), new tables. Avoid `DROP COLUMN` or enum replace until a dedicated cleanup window.
- **Backfills:** use separate optional SQL or one-off scripts **after** migrate — never bundle destructive DDL with data fixes.
- **Enum gotcha:** Postgres cannot remove enum values easily; treat new values as permanent.
- **Verify:** after migrate, spot-check `SELECT status, count(*) FROM users GROUP BY 1` — counts should be unchanged until real deletes happen in the app.

## Do not

- Do not `db:push` / reset / truncate `users` to fix enum drift on a shared database.
- Do not delete migration history or re-apply `0000_*` on a populated database.

## Consumer account deletion (`0002_user_account_deleted`)

- Adds `user_status` value `deleted` and nullable `users.deleted_at`.
- No mass `UPDATE`; existing users stay `active` or `blocked` until `POST /api/v1/user/account/delete`.
- On delete, per-user app data (inbox, prefs, cart, wishlist, addresses, refund requests) is purged; **orders stay** on the tombstone `user_id` for admin history.
