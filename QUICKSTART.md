# CRYPTEX — Quickstart Guide

> Get CRYPTEX running locally in under 5 minutes.

---

## Prerequisites

| Tool | Minimum Version | Check |
|---|---|---|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |
| Python | 3.10+ | `python3 --version` |
| pip | 23.x | `pip --version` |
| Git | any | `git --version` |

---

## Step 1 — Get a CoinMarketCap API Key

CRYPTEX sources all live data from the CoinMarketCap Professional API. A free Basic key is all you need to run the full dashboard.

1. Go to [coinmarketcap.com/api](https://coinmarketcap.com/api/) and click **Get Your Free API Key**
2. Create an account and verify your email
3. Your API key appears on the dashboard — copy it

> The free Basic plan includes all core endpoints: listings, quotes, historical prices, search, and global metrics. Candlestick OHLCV data (`/ohlcv/historical`) requires a Standard plan — on Basic the backend automatically builds approximate charts from daily quote history, so charts always render.

---

## Step 2 — Clone the Repository

```bash
git clone https://github.com/your-org/cryptex.git
cd cryptex
```

---

## Option A — Frontend Only (No Backend, No API Key Needed)

The frontend ships with a complete mock data layer — 20 pre-seeded coins with generated sparklines and OHLC. Use this to preview the UI instantly.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The header shows **● DEMO** and a blue banner indicates mock mode. No API key required.

---

## Option B — Full Stack (Recommended)

Run this to get live CoinMarketCap data, real candlestick charts, and server-side correlation.

### Backend setup

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
```

Edit `backend/.env` and add your key:

```env
CMC_API_KEY=your_coinmarketcap_api_key_here
ALLOWED_ORIGINS=http://localhost:3000
```

Start the backend — two equivalent methods:

```bash
# Method 1 — direct Python (uses the __main__ entrypoint)
python main.py

# Method 2 — uvicorn directly (identical result, more uvicorn flags available)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:

```
INFO  cryptex — CRYPTEX API v2.2.0 starting — data source: CoinMarketCap
INFO  cryptex — CMC API key: configured ✓
INFO  uvicorn — Application startup complete.
INFO  uvicorn — Uvicorn running on http://0.0.0.0:8000
```

Swagger docs are auto-generated at `http://localhost:8000/docs`.

### Frontend setup

```bash
cd ../frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:3000`. The header shows **● LIVE** once the backend responds with real CMC data.

---

## Using the Dashboard

### Coin Grid

The home screen shows 20 assets ranked by market cap. Each card displays symbol, rank, current price, 24h % change, 7-day sparkline, and market cap.

### Analytics Drawer

**Click or tap any coin card** to open the analytics panel. Four tabs are available:

| Tab | Content |
|---|---|
| 📈 CANDLE | OHLC candlestick chart — 7 / 14 / 30 / 90 day periods |
| 〽 LOG | Same chart with log₁₀ Y-axis for cycle analysis |
| ⬛ HEAT | Pearson correlation matrix across top 6 assets |
| 📊 STATS | Full metrics table: price, ATH, supply, volume, CMC rank |

### Command Palette

Press `Ctrl+K` (or `Cmd+K` on Mac) to open spotlight search. Type any coin name or ticker — click a result to open its analytics drawer immediately.

### Filters & Sorting

| Control | Options |
|---|---|
| Filter | ALL / ▲ GAIN / ▼ LOSS |
| Sort | RANK / 24H% / PRICE |

### Live vs Demo Mode

| Header indicator | Meaning |
|---|---|
| `● LIVE` (green) | Backend is up and returning live CMC data |
| `● DEMO` (silver) | Backend unavailable — running on pre-seeded mock data |

The blue info banner appears in demo mode with a **↺ RETRY LIVE** button that re-attempts the backend connection immediately.

---

## Backend `.env` Reference

```env
# ── Required ──────────────────────────────────────────────────
CMC_API_KEY=your_key_here          # CoinMarketCap API key

# ── CORS ──────────────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:3000   # comma-separate multiple origins

# ── Redis cache (optional) ────────────────────────────────────
# If not set, every request goes directly to CMC (no caching)
REDIS_URL=redis://localhost:6379

# ── Server ────────────────────────────────────────────────────
HOST=0.0.0.0
PORT=8000
ENV=development    # set to 'production' to disable auto-reload
```

---

## Common Issues

**`python main.py` exits immediately with no output**
Make sure you are running Python inside the activated virtual environment:
```bash
source venv/bin/activate   # look for (venv) in your prompt
python main.py
```

**Backend starts but header still shows ● DEMO**
Check that `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000` and that you restarted the Next.js dev server after creating the file.

**`503 — CMC_API_KEY is not configured`**
The `CMC_API_KEY` line in `backend/.env` is missing or empty. Add your key and restart the backend.

**CMC returns `401 Unauthorized`**
Your API key is invalid or has been revoked. Generate a new one at [coinmarketcap.com/api](https://coinmarketcap.com/api/).

**CMC returns `429 Too Many Requests`**
The free Basic plan allows 333 calls/day and 10,000/month. The backend caches responses (30s for prices, 5min for OHLC) to minimise usage. If you hit the limit, the frontend falls back to demo data automatically until the next day.

**Port 3000 or 8000 already in use**
```bash
# Kill whatever is on the port
npx kill-port 3000
npx kill-port 8000

# Or run on different ports
npm run dev -- -p 3001
uvicorn main:app --port 8001
```

**CORS error in browser console**
`ALLOWED_ORIGINS` in `backend/.env` must exactly match the frontend origin including protocol and port — e.g. `http://localhost:3000`. Update it and restart the backend.

---

*For production deployment instructions see [DEPLOYMENT.md](./DEPLOYMENT.md).*
