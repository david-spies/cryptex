<img width="1088" height="540" alt="Cryptex" src="https://github.com/user-attachments/assets/494b6cbb-18ea-49a6-ba93-e6422e4bd896" />

# CRYPTEX v2.2
### Real-Time Cryptocurrency Analysis Dashboard

```
  ██████╗██████╗ ██╗   ██╗██████╗ ████████╗███████╗██╗  ██╗
 ██╔════╝██╔══██╗╚██╗ ██╔╝██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝
 ██║     ██████╔╝ ╚████╔╝ ██████╔╝   ██║   █████╗   ╚███╔╝ 
 ██║     ██╔══██╗  ╚██╔╝  ██╔═══╝    ██║   ██╔══╝   ██╔██╗ 
 ╚██████╗██║  ██║   ██║   ██║        ██║   ███████╗██╔╝ ██╗
  ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝        ╚═╝   ╚══════╝╚═╝  ╚═╝
```

> **Tech-Noir crypto analytics for the next generation of traders.**  
> Live prices · Candlestick charts · Log-scale views · Correlation heatmaps · Full mobile support

---

## Overview

CRYPTEX is a modern, full-stack cryptocurrency tracking and analysis tool built with a **tech-noir glitch aesthetic**. It delivers real-time market data, interactive charting, and multi-asset correlation analysis through a sleek, CRT-inspired interface.

The application is architected as two decoupled layers:

- **Frontend** — a React (Next.js) single-page application with a built-in mock data layer, meaning it works in any preview or offline environment even when the backend is unavailable.
- **Backend** — a FastAPI (Python) service that proxies all CoinMarketCap API requests server-side, keeping your CMC API key secure and never exposing it to the browser.

---

## Key Features

| Feature | Description |
|---|---|
| 🟢 Live Price Grid | 20 assets displayed as interactive cards with 7-day sparklines and 24h change |
| 📈 Candlestick Charts | Canvas-rendered OHLC charts with wick/body rendering and date labels |
| 〽 Logarithmic Scale | Toggle log₁₀ Y-axis to visualise percentage moves uniformly across time |
| ⬛ Correlation Heatmap | Pearson-R matrix across top 6 assets, colour-coded green (positive) / blue (negative) |
| 📊 Asset Stats Panel | Market cap, volume, circulating supply, max supply, CMC rank |
| ⌨ Command Palette | `Ctrl+K` spotlight search across all tracked assets |
| 📡 Ticker Bar | Continuous scrolling marquee of all live prices |
| 🔄 Auto-Refresh | 30-second polling cycle with silent live/demo fallback |
| 📱 Mobile-First | Responsive 2→6 column grid, slide-up drawer on mobile, modal on desktop |
| 🎨 Tech-Noir Glitch | CRT scanlines, chromatic aberration title glitch, neon borders, flicker animations |

---

## Data Source

All live market data is sourced exclusively from the **[CoinMarketCap Professional API](https://coinmarketcap.com/api/)**.

| CMC Endpoint | Used for | Min. Plan |
|---|---|---|
| `/v1/cryptocurrency/listings/latest` | Top 20 coins — prices, market cap, volume, % changes | Basic (free) |
| `/v1/cryptocurrency/quotes/latest` | Single-asset live price lookup | Basic (free) |
| `/v2/cryptocurrency/quotes/historical` | Daily price history for OHLC and correlation | Basic (free) |
| `/v2/cryptocurrency/ohlcv/historical` | True OHLCV candlestick data | Standard+ |
| `/v1/cryptocurrency/map` | Coin search by name/symbol | Basic (free) |
| `/v1/global-metrics/quotes/latest` | Total market cap, BTC/ETH dominance | Basic (free) |

> **Free tier note:** The Basic (free) CMC plan covers all core dashboard features. The `/ohlcv/historical` endpoint requires a Standard plan or higher — on Basic, the backend automatically constructs approximate OHLC from the daily quotes history endpoint, so charts always render.

Get your free API key at [coinmarketcap.com/api](https://coinmarketcap.com/api/).

---

## Design System

**Color Palette**

| Token | Hex | Usage |
|---|---|---|
| Background | `#020817` | Page background, deepest layer |
| Card | `#0a1628` | Card surfaces |
| Dark | `#060f1e` | Footer, input backgrounds |
| Modal | `#0d1f38` | Drawer / overlay panels |
| Solarized Green | `#88bb65` | Primary accent, up-moves, borders |
| Slate Blue | `#3b82f6` | Secondary accent, heatmap negative |
| Silver | `#94a3b8` | Body text, labels |
| White | `#f8fafc` | Headings, prices |
| Red | `#ef4444` | Down-moves, loss indicators |

**Typography**
- **Orbitron** — display font for prices, titles, and data values
- **Share Tech Mono** — monospace body font for all UI chrome, labels, and buttons

---

## Project Structure

```
cryptex/
├── frontend/
│   ├── components/
│   │   └── CryptoDashboard.jsx    # Main app component (all sub-components inside)
│   ├── pages/
│   │   └── index.js               # Next.js entry point
│   ├── styles/
│   │   └── globals.css            # Tailwind base + CRT utilities + layout classes
│   └── tailwind.config.js         # Extended color/animation/shadow tokens
│
├── backend/
│   ├── main.py                    # FastAPI app — all routes + CMC integration
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # CMC_API_KEY lives here (never committed)
│
├── README.md
├── QUICKSTART.md
├── TECHSTACK.md
└── DEPLOYMENT.md
```

---

## Quick Links

- [Quickstart Guide](./QUICKSTART.md) — running locally in under 5 minutes
- [Tech Stack](./TECHSTACK.md) — architecture decisions and library rationale
- [Deployment Guide](./DEPLOYMENT.md) — production deployment with full folder structure

---

## License

MIT — free to use, modify, and deploy. Not financial advice.

---

*CRYPTEX is a portfolio and analysis tool. Always DYOR.*
