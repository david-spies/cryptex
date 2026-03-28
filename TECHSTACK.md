# CRYPTEX — Tech Stack

> Architecture decisions, library choices, and design rationale.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React / Next.js (Frontend)               │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │  Coin Grid   │  │  Analytics   │  │  Command   │  │  │
│  │  │  Dashboard   │  │  Drawer      │  │  Palette   │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────┘  │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │  Candle      │  │  Pearson     │  │  Sparkline │  │  │
│  │  │  Chart       │  │  Heatmap     │  │  SVG       │  │  │
│  │  │  (Canvas)    │  │  (CSS Grid)  │  │            │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │  ▲                              │
│                    REST   │  │  JSON                        │
│                           ▼  │                              │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    FastAPI (Backend)                         │
│                                                             │
│  /api/price/{ticker}      → CoinGecko Simple Price          │
│  /api/history/{ticker}    → CoinGecko OHLC                  │
│  /api/market/correlation  → Pandas Pearson-R Matrix         │
│  /api/markets             → CoinGecko Markets List          │
│                           │                                 │
│       ┌───────────────────┼───────────────┐                │
│       ▼                   ▼               ▼                │
│  ┌─────────┐       ┌──────────┐    ┌──────────┐           │
│  │ Redis   │       │CoinGecko │    │CryptoComp│           │
│  │ Cache   │       │  API     │    │  API     │           │
│  │ (5min)  │       │(primary) │    │(fallback)│           │
│  └─────────┘       └──────────┘    └──────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend

### React 18 + Next.js 14

**Why Next.js over plain React?**

- File-based routing means zero router boilerplate for adding future pages (e.g., `/coin/[id]`, `/portfolio`)
- Built-in API routes allow lightweight server-side logic without a separate backend for simple tasks
- `next/image` optimizes coin logo loading with lazy loading and responsive sizing
- SSG/ISR can pre-render market overview pages for SEO and performance

**Why not Vue, Svelte, or Angular?**

React's ecosystem maturity, the availability of financial charting libraries (TradingView Lightweight Charts, Recharts), and the size of the crypto/fintech community building on React make it the pragmatic choice for this domain.

---

### Tailwind CSS

**Why Tailwind?**

The tech-noir design system requires a large number of highly specific, one-off utility combinations — neon glow shadows, CRT scanline overlays, chromatic aberration effects. Tailwind's utility-first model maps directly to these requirements without the overhead of naming BEM classes for every variant.

**Extended tokens used:**

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'solar-green': '#88bb65',
      'slate-blue':  '#3b82f6',
      'noir':        '#020817',
    },
    fontFamily: {
      mono: ['Share Tech Mono', 'Orbitron', 'ui-monospace'],
    },
    animation: {
      glitch:   'glitch 3.5s infinite',
      scanline: 'scanline 9s linear infinite',
      flicker:  'flicker 7s infinite',
    },
    boxShadow: {
      'neon-green': '0 0 5px #88bb65, 0 0 20px rgba(136,187,101,0.35)',
      'neon-blue':  '0 0 5px #3b82f6, 0 0 20px rgba(59,130,246,0.35)',
    },
  },
}
```

---

### Canvas API — Candlestick Charts

**Why raw Canvas over TradingView Lightweight Charts or Chart.js?**

| Concern | Canvas (used) | Lightweight Charts | Chart.js |
|---|---|---|---|
| Bundle size | 0 KB (browser native) | ~45 KB | ~200 KB |
| OHLC rendering | Full control | Built-in | Plugin required |
| Log scale | Full control | Built-in toggle | Limited |
| Mobile DPR | Handled manually | Handled automatically | Partial |
| Glow/neon effects | Full control via `shadowBlur` | Not supported | Not supported |

For the tech-noir aesthetic, the Canvas approach allows per-candle shadow glow on the most recent candle, custom color mapping to the design system, and zero dependency overhead. The implementation handles high-DPI screens via `devicePixelRatio` scaling.

**In a production upgrade**, replacing this with TradingView Lightweight Charts would add crosshair tooltips, volume bars, and indicator overlays (RSI, MACD) with minimal effort.

---

### SVG Sparklines

Sparklines are rendered as pure SVG `<polyline>` elements — no library. The algorithm:

1. Map each price point to `(x, y)` coordinates within the SVG viewBox
2. Normalize Y values between `min` and `max` of the series
3. Color based on whether the series end is above or below the start

This keeps the bundle small and allows sparklines to scale fluidly inside the CSS grid.

---

### Pearson Correlation (Frontend)

In the current frontend-only build, the correlation matrix is computed in-browser from CoinGecko's 7-day sparkline data. This avoids an extra network round-trip to the backend for the preview environment.

```js
const pearson = (a, b) => {
  const n  = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const ea = a[i] - ma, eb = b[i] - mb;
    num += ea * eb; da += ea * ea; db += eb * eb;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
};
```

In the full-stack deployment, this computation moves to the FastAPI backend where Pandas can use 30-day daily close data for a more statistically significant window.

---

## Backend

### FastAPI (Python 3.10+)

**Why FastAPI over Flask, Django, or Express?**

| Concern | FastAPI | Flask | Django | Express |
|---|---|---|---|---|
| Async support | Native (`async/await`) | Bolt-on (Quart) | Limited | Native |
| Auto-generated docs | Swagger + ReDoc | Manual | Manual | Manual |
| Type validation | Pydantic built-in | Manual | Manual | Manual |
| Performance | ~Starlette (very fast) | WSGI (slower) | WSGI (slower) | Node event loop |
| Crypto API calls | `httpx` async client | `requests` (blocking) | `requests` (blocking) | `axios` |

The async nature of FastAPI is the critical differentiator here. Every response involves at least one outbound HTTP request to CoinGecko or CryptoCompare. With synchronous frameworks, each request blocks a thread. FastAPI + `httpx` AsyncClient handles all of these concurrently without thread pool overhead.

---

### httpx — Async HTTP Client

```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.get(url, timeout=7.0)
```

`httpx` is the async equivalent of the popular `requests` library. It supports HTTP/2, connection pooling, and `AsyncClient` context managers for efficient resource cleanup — all critical for a service making many simultaneous outbound calls to crypto APIs.

---

### Pandas + NumPy — Correlation Engine

```python
import pandas as pd
import numpy as np

combined_df = pd.DataFrame(data_frames)
corr_matrix = combined_df.pct_change().corr().replace({np.nan: 0})
```

Using `pct_change()` before computing `.corr()` is important — it ensures the correlation reflects **relative price movements** (returns) rather than absolute price levels. Two assets priced at $60k and $2k would show a spuriously high correlation on raw prices simply due to shared upward trends.

---

### Redis — Response Cache

Historical OHLC data is cached with a 5-minute TTL. This prevents the same 90-day BTC chart from triggering a new CoinGecko request every time a user switches tabs.

```python
import redis.asyncio as redis

cache = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

async def get_ohlc_cached(coin_id: str, days: int):
    key = f"ohlc:{coin_id}:{days}"
    cached = await cache.get(key)
    if cached:
        return json.loads(cached)
    data = await fetch_ohlc_from_api(coin_id, days)
    await cache.set(key, json.dumps(data), ex=300)
    return data
```

Redis is optional — the app degrades gracefully without it by making direct API calls.

---

## Data Sources

### CoinGecko API (Primary)

| Endpoint | Used for |
|---|---|
| `/coins/markets` | Top 20 coins by market cap with sparklines |
| `/coins/{id}/ohlc` | OHLC candlestick data (7/14/30/90 days) |
| `/simple/price` | Quick single-asset price lookup |
| `/coins/{id}/market_chart` | Full historical price series |

**Rate limits (free tier):** ~10–30 calls/minute. A Demo API key (free) raises this to 30 calls/minute with higher burst allowance.

### CryptoCompare API (Fallback)

Used as a secondary source for historical daily OHLC when CoinGecko is rate-limited or unavailable. Requires a free API key.

### Mock Data Layer (Always Available)

20 pre-seeded coins with:
- Realistic prices and market metrics (as of build time)
- Procedurally generated 7-day sparklines using a random walk with configurable volatility
- Pre-baked 60-candle OHLC sequences per asset

This ensures the application is fully demonstrable in sandboxed environments (Claude Artifacts, CodeSandbox, StackBlitz) where outbound API calls are blocked.

---

## Design System

### Fonts

| Font | Source | Role |
|---|---|---|
| Orbitron | Google Fonts | Prices, titles, data values — the "display" voice |
| Share Tech Mono | Google Fonts | All UI chrome, labels, buttons, body — the "terminal" voice |

Orbitron was chosen for its hard-edged, geometric letterforms that evoke military HUDs and sci-fi terminals. Share Tech Mono reads as authentic console output — a monospace that looks like it was designed for a CRT screen, not a Google doc.

### Animation Strategy

| Effect | Implementation | Trigger |
|---|---|---|
| Title glitch | `clip-path` + `transform` on `::before`/`::after` pseudo-elements | Continuous, 3.5s cycle |
| Screen flicker | `opacity` keyframes with irregular timing | Continuous, 7s cycle |
| CRT scanline | Translating linear gradient overlay, `position:fixed` | Continuous, 9s cycle |
| CRT raster | `repeating-linear-gradient` on `position:fixed` overlay | Passive — always on |
| Card pop | `scale` + `opacity` on mount | One-shot on render |
| Drawer slide | `translateY(100%)` → `translateY(0)` | One-shot on open |
| Neon glow | `box-shadow` with color-matched rgba blur | Hover state |
| Live dot blink | `opacity` 1 → 0 → 1 | Continuous, 1.1s |

All animations are pure CSS — no JavaScript animation libraries. This keeps the runtime lean and avoids layout thrashing.

---

## Performance Considerations

- **Mock data hydration** is synchronous and zero-cost — the UI renders on the first paint before any network request completes
- **Canvas charts** use `devicePixelRatio` scaling for sharp rendering on Retina/HiDPI displays
- **Sparklines** are pure SVG with no third-party dependency — each is under 500 bytes of markup
- **30-second polling** instead of WebSocket connection keeps the architecture simple while still feeling near-real-time
- **AbortSignal.timeout(7000)** on all fetch calls ensures stalled requests don't block the UI thread
- **CSS Grid** layout with `auto-fill` and `minmax` eliminates JavaScript-based responsive logic entirely

---

## Future Upgrade Path

| Feature | Technology | Effort |
|---|---|---|
| WebSocket live prices | Binance WS API + React context | Medium |
| TradingView charts | Lightweight Charts library | Low |
| Portfolio tracker | Supabase (Postgres + Auth) | High |
| Price alerts | Server-Sent Events + Redis pub/sub | Medium |
| RSI / MACD indicators | `ta-lib` Python wrapper | Medium |
| PWA / offline | Next.js PWA plugin + Service Worker | Low |
| Dark/light theme toggle | CSS custom properties | Low |
