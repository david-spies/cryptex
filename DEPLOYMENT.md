# CRYPTEX — Deployment Guide

> Complete deployment instructions for all environments — local, Docker, Vercel + Render, and VPS.

---

## Complete Project File Structure

Every file's location is deliberate. Deviation from this structure will cause build failures or missing environment variables.

```
cryptex/                                    ← repository root
│
├── README.md
├── QUICKSTART.md
├── TECHSTACK.md
├── DEPLOYMENT.md                           ← this file
├── .gitignore                              ← excludes node_modules, venv, .env files
├── docker-compose.yml                      ← orchestrates frontend + backend + redis
│
├── frontend/                               ← Next.js application
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.js
│   ├── tailwind.config.js                  ← design token extensions
│   ├── postcss.config.js
│   ├── jsconfig.json
│   ├── .env.local                          ← LOCAL ONLY — never commit (gitignored)
│   ├── .env.local.example                  ← committed template with blank values
│   │
│   ├── pages/
│   │   ├── _app.js                         ← global layout, imports globals.css
│   │   ├── _document.js                    ← custom <head>, loads Google Fonts
│   │   └── index.js                        ← home route → renders <CryptoDashboard />
│   │
│   ├── components/
│   │   └── CryptoDashboard.jsx             ← entire dashboard (all sub-components)
│   │
│   ├── styles/
│   │   └── globals.css                     ← Tailwind directives + CRT + layout classes
│   │
│   └── public/
│       ├── favicon.ico
│       └── og-image.png
│
├── backend/                                ← FastAPI application
│   ├── main.py                             ← all routes + CMC API integration
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env                                ← LOCAL ONLY — never commit (gitignored)
│   └── .env.example                        ← committed template with blank values
│
└── infrastructure/
    └── nginx.conf                          ← reverse proxy config (VPS deployments)
```

---

## Environment Variables Reference

### Frontend — `frontend/.env.local` *(never committed)*

```env
# URL of your FastAPI backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional — used in OG meta tags
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Frontend — `frontend/.env.local.example` *(committed)*

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=
```

### Backend — `backend/.env` *(never committed)*

```env
# ── Required ──────────────────────────────────────────────────
# CoinMarketCap API key — free at https://coinmarketcap.com/api/
CMC_API_KEY=your_coinmarketcap_api_key_here

# ── CORS ──────────────────────────────────────────────────────
# Comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=http://localhost:3000

# ── Redis cache (optional) ────────────────────────────────────
# Skipped gracefully if not set — app makes direct CMC calls instead
REDIS_URL=redis://localhost:6379

# ── Server ────────────────────────────────────────────────────
HOST=0.0.0.0
PORT=8000
# Set to 'production' to disable uvicorn auto-reload
ENV=development
```

### Backend — `backend/.env.example` *(committed)*

```env
CMC_API_KEY=
ALLOWED_ORIGINS=http://localhost:3000
REDIS_URL=
HOST=0.0.0.0
PORT=8000
ENV=development
```

---

## Deployment Option 1 — Local Development

### Files to verify before starting

```
backend/.env              ← must exist with CMC_API_KEY filled in
backend/venv/             ← created by: python3 -m venv venv
frontend/.env.local       ← must exist with NEXT_PUBLIC_API_URL set
frontend/node_modules/    ← created by: npm install
```

### Commands

```bash
# Terminal 1 — Backend
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# → edit .env and add your CMC_API_KEY

python main.py
# or equivalently:
# uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
cp .env.local.example .env.local
# → edit .env.local and set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

**Access points:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

---

## Deployment Option 2 — Docker Compose

Starts the frontend, backend, and Redis in a single command. Recommended for staging environments and consistent local setup across teams.

### Files involved

```
cryptex/
├── docker-compose.yml          ← repository root
├── frontend/
│   ├── Dockerfile
│   └── .env.local              ← do NOT mount — use docker-compose environment block
└── backend/
    ├── Dockerfile
    └── .env                    ← do NOT mount — use docker-compose env_file block
```

### `docker-compose.yml` (repository root)

```yaml
version: '3.9'

services:

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env               # ← reads CMC_API_KEY from backend/.env
    environment:
      - REDIS_URL=redis://redis:6379
      - ENV=production
    depends_on:
      - redis
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  redis_data:
```

### `backend/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Use uvicorn directly in Docker (not python main.py)
# This avoids the double-process overhead of the __main__ launcher
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next       ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public      ./public

EXPOSE 3000
CMD ["npm", "start"]
```

### Deploy

```bash
# From repository root
cp backend/.env.example backend/.env
# → edit backend/.env and add CMC_API_KEY

docker compose up --build -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop
docker compose down
```

---

## Deployment Option 3 — Vercel (Frontend) + Render (Backend)

Zero-infrastructure production setup. Both platforms have free tiers sufficient for a personal or portfolio project.

### Frontend → Vercel

**Files Vercel reads:**

| File | Path | Purpose |
|---|---|---|
| Build source | `frontend/` | Entire Next.js app |
| Config | `frontend/next.config.js` | Build settings |
| Environment | Vercel dashboard → Settings → Environment Variables | Replaces `.env.local` |
| Static assets | `frontend/public/` | Served at root URL |

**Steps:**

1. Push your repository to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Set **Root Directory** to `frontend` ← critical, do not leave as repo root
4. Framework Preset auto-detects as **Next.js** — leave it
5. Under **Environment Variables**, add:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend.onrender.com
   ```
   *(You'll get this URL after the Render deploy below)*
6. Click **Deploy**

---

### Backend → Render

**Files Render reads:**

| File | Path | Purpose |
|---|---|---|
| Build source | `backend/` | Entire FastAPI app |
| Dependencies | `backend/requirements.txt` | Installed during build |
| Start command | Render dashboard | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Environment | Render dashboard → Environment | Replaces `backend/.env` |

**Steps:**

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repository
3. Set **Root Directory** to `backend`
4. Set **Runtime** to `Python 3`
5. Set **Build Command** to:
   ```
   pip install -r requirements.txt
   ```
6. Set **Start Command** to:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
7. Under **Environment Variables**, add:
   ```
   CMC_API_KEY      = your_coinmarketcap_api_key_here
   ALLOWED_ORIGINS  = https://your-project.vercel.app
   ENV              = production
   ```
8. Click **Create Web Service**

Render assigns a URL like `https://cryptex-api.onrender.com`. Copy this into your Vercel `NEXT_PUBLIC_API_URL` environment variable, then trigger a redeploy on Vercel.

**Adding Redis on Render (optional but recommended):**
1. Render dashboard → **New** → **Redis**
2. Copy the **Internal Redis URL**
3. Add to your web service environment variables:
   ```
   REDIS_URL = redis://red-xxxx:6379
   ```
   Redis caches CMC responses (30s for prices, 5min for OHLC) and significantly reduces daily API call usage against your CMC quota.

---

## Deployment Option 4 — VPS / Self-Hosted (Ubuntu 22.04)

Full control — DigitalOcean Droplet, Linode, Hetzner, or AWS EC2.

### File placement on the server

```
/var/www/cryptex/               ← application root
├── frontend/
├── backend/
└── infrastructure/
    └── nginx.conf              ← symlinked to /etc/nginx/sites-available/cryptex
```

### Step 1 — Server setup

```bash
ssh root@your-server-ip

apt update && apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Python 3.11
apt install -y python3.11 python3.11-venv python3-pip

# Redis
apt install -y redis-server
systemctl enable redis-server && systemctl start redis-server

# Nginx
apt install -y nginx

# PM2 (Node process manager)
npm install -g pm2

mkdir -p /var/www/cryptex && cd /var/www/cryptex
```

### Step 2 — Deploy the code

```bash
git clone https://github.com/your-org/cryptex.git .

# Backend
cd /var/www/cryptex/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
nano .env
# → add CMC_API_KEY=your_key_here
# → set ALLOWED_ORIGINS=https://your-domain.com
# → set REDIS_URL=redis://localhost:6379
# → set ENV=production

# Frontend
cd /var/www/cryptex/frontend
npm ci
cp .env.local.example .env.local
nano .env.local
# → set NEXT_PUBLIC_API_URL=https://api.your-domain.com
npm run build
```

### Step 3 — Start processes with PM2

```bash
# Backend — use uvicorn directly in production (not python main.py)
cd /var/www/cryptex/backend
source venv/bin/activate
pm2 start "uvicorn main:app --host 127.0.0.1 --port 8000" --name cryptex-api

# Frontend
cd /var/www/cryptex/frontend
pm2 start "npm start" --name cryptex-web

# Persist across reboots
pm2 save
pm2 startup    # → run the command PM2 outputs
```

### Step 4 — Configure Nginx

Create `/etc/nginx/sites-available/cryptex`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/cryptex /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL certificates
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
certbot --nginx -d api.your-domain.com
```

### Step 5 — Verify

```bash
pm2 status
systemctl status nginx
redis-cli ping                          # → PONG
curl https://api.your-domain.com/health # → {"status":"ok","cmc_key":true,...}
curl -I https://your-domain.com
```

---

## CI/CD — GitHub Actions (Optional)

Place at `.github/workflows/deploy.yml`:

```yaml
name: Deploy CRYPTEX

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Trigger Render deploy
        run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        run: npx vercel --token=${{ secrets.VERCEL_TOKEN }} --prod --cwd frontend
```

**Required GitHub Secrets:**

| Secret | Where to find it |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render → Service → Settings → Deploy Hook |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |

---

## Post-Deployment Checklist

```
□ Frontend loads at production URL
□ Header shows ● LIVE (green dot)
□ Footer reads "COINMARKETCAP LIVE · 30s REFRESH"
□ Ticker bar scrolls with live prices
□ Clicking a coin card opens the analytics drawer
□ Candlestick chart renders with data
□ Correlation heatmap shows colour-coded matrix
□ Ctrl+K opens command palette; selecting a coin opens the drawer
□ /health endpoint returns { "status": "ok", "cmc_key": true }
□ SSL certificate is valid (no browser warnings)
□ ALLOWED_ORIGINS in backend .env matches the frontend production URL exactly
□ Redis REDIS_URL is set and "redis": true appears in /health response
□ PM2 processes restart automatically on server reboot (pm2 save completed)
□ CMC API key has sufficient daily call quota for expected traffic
```

---

## CMC API Quota Management

The free Basic plan allows **10,000 calls/month** (≈333/day). CRYPTEX's Redis cache minimises usage:

| Endpoint | Cache TTL | Calls saved per user session |
|---|---|---|
| `/api/markets` | 30 seconds | ~59 per 30 min |
| `/api/history/{id}` | 5 minutes | ~5 per chart open |
| `/api/market/correlation` | 5 minutes | ~1 per session |
| `/api/price/{symbol}` | 30 seconds | ~59 per 30 min |

Without Redis, every page refresh and every 30-second poll hits CMC directly. With Redis on any plan, a single warm cache serves unlimited concurrent users within the TTL window.

---

## Rollback

**Vercel:** Dashboard → Deployments → select previous deployment → Promote to Production

**Render:** Dashboard → Events → select previous deploy → Rollback

**VPS with PM2:**
```bash
cd /var/www/cryptex
git log --oneline -10
git checkout <commit-hash>
cd frontend && npm run build
pm2 restart cryptex-web
pm2 restart cryptex-api
```
