# Backend VPS deployment (decorbuddys.com)

| Runs on VPS | Runs on Cloudflare Pages |
|-------------|---------------------------|
| API, worker, Valkey (Docker), Caddy | Customer **web**, **admin** |

Primary domain: **decorbuddys.com**. Point **decorbuddys.in** → `.com` with a Cloudflare Redirect Rule if you own both.

---

## What you install on the server

| Software | Purpose |
|----------|---------|
| **Node.js 20 LTS** | Build and run the backend |
| **Docker** | Two Valkey containers (queue + cache) |
| **PM2** | Keeps API + worker running after logout/reboot |
| **Caddy** | HTTPS + reverse proxy `api.decorbuddys.com` → `localhost:3000` |
| **Git** | Pull code |

You do **not** install Postgres or Nginx on the VPS (DB = Supabase URL in `.env`).

---

## 1. Install Node.js, Docker, PM2, Caddy (Ubuntu)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x

# Docker
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker

# PM2 (process manager for Node)
sudo npm install -g pm2

# Caddy (automatic HTTPS)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Firewall (only SSH + web):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw enable
```

---

## 2. Clone repo and start Valkey

```bash
sudo mkdir -p /opt/decory
sudo chown $USER:$USER /opt/decory
git clone <your-repo-url> /opt/decory
cd /opt/decory
docker compose up -d
docker compose ps
```

In `backend/.env`:

```env
REDIS_URL=redis://127.0.0.1:6379/0
REDIS_CACHE_URL=redis://127.0.0.1:6380/0
```

---

## 3. Backend `.env`

```bash
cd /opt/decory/backend
cp .env.sample .env
nano .env
```

Fill at minimum:

- `POSTGRES_DATABASE_URL` (Supabase **pooler**)
- `AI_ENABLED=false` (no `AI_DATABASE_URL` needed)
- Redis URLs above
- `API_PUBLIC_URL`, `WEB_APP_ORIGIN`, `ADMIN_APP_ORIGIN` (`.com` hosts)
- `JWT_SECRET`, `OTP_PEPPER`, payment/SMS/R2 keys
- **SMS (India):** `SMS_PROVIDER=msg91`, MSG91 auth key, sender ID, DLT template IDs — follow **[docs/sms.md](docs/sms.md)**. Worker must run or OTP/booking SMS will not send.
- **WhatsApp (phase 1):** `WHATSAPP_PROVIDER=msg91`, `MSG91_FLOW_*` per event — **[docs/message-service.md](docs/message-service.md)**. Recommended: admin **sms off**, **whatsapp on** until DLT SMS is approved.

Build and migrate:

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm run db:migrate
```

If migrate fails because the database already has tables but Drizzle tries to re-run `0000` (`user_role already exists`):

```bash
pnpm run db:baseline
pnpm run db:migrate
```

---

## 4. PM2 — run API and worker

From `backend/` (paths in `ecosystem.config.cjs` assume `/opt/decory/backend`):

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# run the command pm2 prints (sudo env PATH=...)
```

Useful commands:

```bash
pm2 status
pm2 logs decory-api
pm2 logs decory-worker
pm2 restart all
```

Production **must** run both **decory-api** and **decory-worker**.

---

## 5. Caddy — reverse proxy

Edit **`/etc/caddy/Caddyfile`**:

```caddy
api.decorbuddys.com {
    reverse_proxy localhost:3000
}
```

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### Cloudflare DNS (decorbuddys.com zone)

| Type | Name | Content |
|------|------|---------|
| A | api | `<VPS IPv4>` (proxied orange cloud OK) |
| CNAME | admin | `<admin-pages>.pages.dev` |
| CNAME | @ or www | `<web-pages>.pages.dev` |

**SSL/TLS** in Cloudflare: **Full (strict)** if Caddy has a valid certificate.

- If API record is **DNS only** (grey), Caddy can obtain Let's Encrypt automatically.
- If **proxied** (orange), use a [Cloudflare origin certificate](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/) on Caddy or switch API to DNS only.

---

## 6. Cloudflare Pages (web + admin)

### Web (`app/web`)

- Root directory: `app/web`
- Build: `pnpm install --frozen-lockfile && pnpm run build`
- Output: `dist`
- Production env: `VITE_API_URL=https://api.decorbuddys.com/api/v1`
- Custom domain: `decorbuddys.com` (and/or `www`)

### Admin (`app/admin`)

- Root: `app/admin`
- Build: `pnpm install --frozen-lockfile && pnpm run build` → `dist`
- Env: `VITE_API_URL=https://api.decorbuddys.com/api/v1`, `VITE_WEB_URL=https://decorbuddys.com`
- Custom domain: `admin.decorbuddys.com`

---

## 7. Verify

```bash
curl -s https://api.decorbuddys.com/health
pm2 status
docker compose ps
```

Register payment webhooks to `https://api.decorbuddys.com/api/v1/webhooks/...`.

---

## Updates

```bash
cd /opt/decory && git pull
cd backend && pnpm install --frozen-lockfile && pnpm run build && pnpm run db:migrate
cd .. && docker compose up -d
pm2 restart all
```
