# Decory — local development setup

Monorepo layout:

| Path | What it is |
|------|------------|
| `backend/` | API (Express) + shared DB/Redis |
| `backend/` worker | BullMQ jobs (SMS, email, push, media optimize, payouts, etc.) |
| `app/web/` | Customer web app (Vite) |
| `app/admin/` | Admin panel (Vite) |
| `app/vendor/` | Partner mobile app (Expo) |
| `app/website/` | Marketing site (Vite), optional |
| `docker-compose.yml` | Local **Valkey** (Redis-compatible) for `REDIS_URL` |

**Package manager:** use [pnpm](https://pnpm.io/) in each app folder (`pnpm install`).

---

## 1. Prerequisites

- **Node.js** 20+ (LTS recommended)
- **pnpm**
- **Docker Desktop** (for local Valkey)
- **PostgreSQL** — connection string in `backend/.env` as `POSTGRES_DATABASE_URL` (often Supabase or local Postgres)

---

## 2. Valkey (Redis) for backend + worker

From the **repo root**:

```bash
docker compose up -d valkey
```

Check:

```bash
docker ps
docker exec -it decory-valkey valkey-cli ping
```

Expect `PONG`.

In **`backend/.env`** (API and worker run on your machine, not inside Docker):

```env
REDIS_URL=redis://localhost:6379
```

Do **not** use `redis://valkey:6379` unless the Node process runs in the same Docker Compose network.

Restart API/worker after changing `REDIS_URL`.

---

## 3. Backend API

```bash
cd backend
pnpm install
cp .env.example .env   # if you don't have .env yet — then fill secrets
pnpm run db:migrate    # apply Drizzle migrations
pnpm run dev           # API on PORT from .env (default 3000)
```

- Base URL: `http://localhost:3000`
- API prefix: `/api/v1` (e.g. `http://localhost:3000/api/v1`)

Useful DB commands (from `backend/`):

| Command | Purpose |
|---------|---------|
| `pnpm run db:migrate` | Run migrations |
| `pnpm run db:baseline` | Mark `0000` applied when DB already exists (then migrate again) |
| `pnpm run db:generate` | Generate migration after schema changes |
| `pnpm run db:studio` | Drizzle Studio |
| `pnpm run db:seed:templates` | Seed notification templates |

Production-style:

```bash
pnpm run build
pnpm run start
```

---

## 4. Backend worker (required for queues)

Runs **BullMQ** workers: notifications (SMS/email/push), upload optimize, payment webhooks, assignment reminders, settlement sweep, etc. Uses the same `backend/.env` and **`REDIS_URL`**.

**Second terminal:**

```bash
cd backend
pnpm run worker:dev    # watch mode (recommended for dev)
```

Or without watch:

```bash
pnpm run worker
```

Run **API + worker + Valkey** together for full behavior (OTP, async notifications, image optimize, etc.).

---

## 5. Customer web (`app/web`)

```bash
cd app/web
pnpm install
pnpm run dev
```

- URL: **http://localhost:5174** (fixed in `vite.config.js`)
- Optional `.env`: `VITE_API_URL=http://localhost:3000/api/v1`, `VITE_GOOGLE_CLIENT_ID=...`

---

## 6. Admin panel (`app/admin`)

```bash
cd app/admin
pnpm install
cp .env.example .env   # optional; defaults point at local API
pnpm run dev
```

- URL: **http://localhost:5173** (Vite default)
- `.env`: `VITE_API_URL=http://localhost:3000/api/v1`, `VITE_WEB_URL=http://localhost:5174`

---

## 7. Vendor / partner app (`app/vendor`)

```bash
cd app/vendor
pnpm install
pnpm start
```

Set API URL for device/emulator (e.g. `.env` or `app/vendor/lib/env.ts`):

- Physical device / emulator cannot use `localhost` for your PC API — use your machine LAN IP or a tunnel (ngrok), e.g. `EXPO_PUBLIC_API_URL=http://<your-ip>:3000/api/v1`

Expo docs: [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/).

---

## 7b. Customer mobile app (`app/user`)

Uses **npm** (not pnpm) in this folder.

```bash
cd app/user
npm install
npm start
```

If install fails with `TAR_ENTRY_ERROR` on Windows (common under **OneDrive**), pause OneDrive sync, delete `node_modules`, then run `npm install` again. Prefer cloning the repo outside synced Desktop folders when possible.

`babel-preset-expo` is a direct dependency (required by `babel.config.js`). After dependency changes: `npx expo start -c`.

---

## 8. Website (`app/website`) — optional

```bash
cd app/website
pnpm install
pnpm run dev
```

---

## 9. Typical dev session (checklist)

Open **separate terminals**:

1. **Repo root:** `docker compose up -d valkey`
2. **`backend/`:** `pnpm run dev` (API)
3. **`backend/`:** `pnpm run worker:dev` (worker)
4. **`app/web/`:** `pnpm run dev` → http://localhost:5174
5. **`app/admin/`:** `pnpm run dev` → http://localhost:5173
6. **`app/vendor/`:** `pnpm start` (when working on mobile)

---

## 10. Common issues

| Problem | Fix |
|---------|-----|
| `no configuration file provided` for Docker | Run `docker compose` from repo root where `docker-compose.yml` lives |
| `ENOTFOUND valkey` | Use `REDIS_URL=redis://localhost:6379` when API runs on host |
| `Redis connection failed` | Start Valkey: `docker compose up -d valkey` |
| Custom admin booking FK on `product_id` | Do not set fake `ADMIN_CUSTOM_PRODUCT_ID`; run `pnpm run db:migrate` (creates slug `admin-custom-booking`) |
| Web cannot reach API | CORS/`WEB_APP_ORIGIN` in `backend/.env`; `VITE_API_URL` must match API |

---

## 11. Environment files (summary)

| App | File | Key variables |
|-----|------|----------------|
| Backend | `backend/.env` | `POSTGRES_DATABASE_URL`, `REDIS_URL`, `PORT`, `JWT_SECRET`, payment/SMS keys, `WEB_APP_ORIGIN` |
| Admin | `app/admin/.env` | `VITE_API_URL`, `VITE_WEB_URL` |
| Web | `app/web/.env` | `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID` |
| Vendor | Expo env / `lib/env.ts` | API base URL reachable from device |

Never commit real secrets; keep `.env` out of git.

---

## 12. Backend production (VPS + PM2)

Full VPS guide (Caddy, Cloudflare, Pages): **[backend/DEPLOY.md](backend/DEPLOY.md)**.

**Typical split:**

| Where | What |
|-------|------|
| VPS | API, BullMQ **worker**, Valkey (Docker), Caddy → `api.yourdomain.com` |
| Cloudflare Pages (or similar) | Customer **web** (`app/web`), **admin** (`app/admin`) |

Postgres is usually **hosted** (e.g. Supabase) via `POSTGRES_DATABASE_URL` in `backend/.env` — not on the VPS.

### 12.1 Server stack

Install on Ubuntu (summary): **Node.js 20+**, **Docker**, **PM2**, **Caddy** (HTTPS reverse proxy to `localhost:3000`). See [DEPLOY.md §1](backend/DEPLOY.md).

### 12.2 Deploy code and Valkey

```bash
sudo mkdir -p /opt/decory && sudo chown $USER:$USER /opt/decory
git clone <your-repo-url> /opt/decory
cd /opt/decory
docker compose up -d    # valkey-queue :6379, valkey-cache :6380
```

In **`backend/.env`** on the server:

```env
NODE_ENV=production
PORT=3000
POSTGRES_DATABASE_URL=...          # pooler URL
REDIS_URL=redis://127.0.0.1:6379/0
REDIS_CACHE_URL=redis://127.0.0.1:6380/0
API_PUBLIC_URL=https://api.yourdomain.com
WEB_APP_ORIGIN=https://yourdomain.com
ADMIN_APP_ORIGIN=https://admin.yourdomain.com
JWT_SECRET=...
# SMS, payments, R2, etc. — see backend/.env.example or .env.prod
```

### 12.3 Build, migrate, baseline (if needed)

```bash
cd /opt/decory/backend
pnpm install --frozen-lockfile
pnpm run build
pnpm run db:migrate
```

If migrate fails with **`user_role already exists`** (DB existed before Drizzle journal was synced):

```bash
pnpm run db:baseline   # marks initial migration as applied (drizzle.__drizzle_migrations)
pnpm run db:migrate
```

### 12.4 PM2 — API + worker (required in production)

PM2 config: **`backend/ecosystem.config.cjs`**

| Process | Role |
|---------|------|
| `decory-api` | HTTP API (`src/server.ts` via tsx) |
| `decory-worker` | Queues: OTP/SMS, email, push, media optimize, webhooks, etc. |

```bash
cd /opt/decory/backend
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# run the sudo command PM2 prints once, then: pm2 save again
```

**Day-to-day:**

```bash
pm2 status
pm2 logs decory-api
pm2 logs decory-worker
pm2 restart decory-api
pm2 restart decory-worker
pm2 restart all
```

Production **must** run **both** processes. Without `decory-worker`, OTP, notifications, and async jobs will not run.

### 12.5 Reverse proxy (Caddy example)

Point `api.yourdomain.com` at the API port (default **3000**). Example Caddyfile snippet is in [DEPLOY.md §5](backend/DEPLOY.md).

Verify:

```bash
curl -s https://api.yourdomain.com/health
pm2 status
docker compose ps
```

### 12.6 Release / update on the server

```bash
cd /opt/decory && git pull
cd backend && pnpm install --frozen-lockfile && pnpm run build && pnpm run db:migrate
cd .. && docker compose up -d
pm2 restart all
```

### 12.7 Frontends (not on PM2)

Build and host **web** and **admin** separately (e.g. Cloudflare Pages). Set:

- `VITE_API_URL=https://api.yourdomain.com/api/v1`
- Admin: `VITE_WEB_URL=https://yourdomain.com`

Details: [DEPLOY.md §6](backend/DEPLOY.md).
