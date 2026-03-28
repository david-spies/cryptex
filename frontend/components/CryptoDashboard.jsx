// frontend/components/CryptoDashboard.jsx
// =============================================================
//  CRYPTEX v2.2 — Main Dashboard Component
//  Data source: CoinMarketCap API (routed via FastAPI backend)
//
//  Sub-components:
//    Spark · CandleChart · Heatmap · CoinCard · Drawer · CmdPalette
// =============================================================

import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
export const C = {
  bg:        "#020817",
  bgCard:    "#0a1628",
  bgDark:    "#060f1e",
  bgModal:   "#0d1f38",
  green:     "#88bb65",
  greenDim:  "rgba(136,187,101,0.13)",
  greenGlow: "rgba(136,187,101,0.38)",
  blue:      "#3b82f6",
  blueDim:   "rgba(59,130,246,0.13)",
  blueGlow:  "rgba(59,130,246,0.38)",
  silver:    "#94a3b8",
  white:     "#f8fafc",
  red:       "#ef4444",
  slate:     "#1e293b",
};

// ─────────────────────────────────────────────────────────────
//  CMC LOGO HELPER
//  CoinMarketCap hosts all coin logos at a stable CDN path
//  keyed by their numeric coin ID.
// ─────────────────────────────────────────────────────────────
const cmcLogo = id =>
  `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`;

// ─────────────────────────────────────────────────────────────
//  MOCK DATA GENERATORS  — zero-network offline / demo mode
// ─────────────────────────────────────────────────────────────
function makeSpark(base, n = 168, vol = 0.03) {
  const arr = [base];
  for (let i = 1; i < n; i++)
    arr.push(arr[i - 1] * (1 + (Math.random() - 0.49) * vol));
  return arr;
}

function makeOHLC(base, n = 60, vol = 0.045) {
  let price = base;
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => {
    const ts = now - (n - i) * 86_400_000;
    const o = price;
    const h = o * (1 + Math.random() * vol);
    const l = o * (1 - Math.random() * vol);
    const c = l + Math.random() * (h - l);
    price = c;
    return [ts, +o.toFixed(6), +h.toFixed(6), +l.toFixed(6), +c.toFixed(6)];
  });
}

// Pre-seeded mock coins — all keyed by CoinMarketCap numeric ID
// Logo URLs use the CMC CDN; field names match the normalised shape
// returned by the FastAPI /api/markets endpoint.
export const MOCK_COINS = [
  { cmcId:1,     symbol:"BTC",   name:"Bitcoin",           current_price:67420,      market_cap:1.33e12, total_volume:28e9,   price_change_percentage_24h:2.41,  price_change_percentage_7d:5.3,   market_cap_rank:1,  ath:73750,    circulating_supply:19.7e6,  max_supply:21e6    },
  { cmcId:1027,  symbol:"ETH",   name:"Ethereum",          current_price:3512,       market_cap:4.22e11, total_volume:14e9,   price_change_percentage_24h:1.87,  price_change_percentage_7d:3.1,   market_cap_rank:2,  ath:4878,     circulating_supply:120e6,   max_supply:null    },
  { cmcId:5426,  symbol:"SOL",   name:"Solana",            current_price:182,        market_cap:8.1e10,  total_volume:3.8e9,  price_change_percentage_24h:4.22,  price_change_percentage_7d:9.7,   market_cap_rank:5,  ath:260,      circulating_supply:446e6,   max_supply:null    },
  { cmcId:1839,  symbol:"BNB",   name:"BNB",               current_price:589,        market_cap:8.6e10,  total_volume:2.1e9,  price_change_percentage_24h:-0.54, price_change_percentage_7d:-1.2,  market_cap_rank:4,  ath:691,      circulating_supply:145e6,   max_supply:200e6   },
  { cmcId:52,    symbol:"XRP",   name:"XRP",               current_price:0.612,      market_cap:3.5e10,  total_volume:1.9e9,  price_change_percentage_24h:-1.32, price_change_percentage_7d:-3.4,  market_cap_rank:6,  ath:3.40,     circulating_supply:57e9,    max_supply:100e9   },
  { cmcId:2010,  symbol:"ADA",   name:"Cardano",           current_price:0.459,      market_cap:1.62e10, total_volume:520e6,  price_change_percentage_24h:0.78,  price_change_percentage_7d:2.1,   market_cap_rank:9,  ath:3.10,     circulating_supply:35e9,    max_supply:45e9    },
  { cmcId:74,    symbol:"DOGE",  name:"Dogecoin",          current_price:0.1632,     market_cap:2.33e10, total_volume:1.1e9,  price_change_percentage_24h:3.11,  price_change_percentage_7d:6.4,   market_cap_rank:8,  ath:0.74,     circulating_supply:143e9,   max_supply:null    },
  { cmcId:5805,  symbol:"AVAX",  name:"Avalanche",         current_price:37.8,       market_cap:1.55e10, total_volume:720e6,  price_change_percentage_24h:-2.14, price_change_percentage_7d:-4.8,  market_cap_rank:10, ath:146,      circulating_supply:410e6,   max_supply:720e6   },
  { cmcId:1975,  symbol:"LINK",  name:"Chainlink",         current_price:14.82,      market_cap:8.7e9,   total_volume:480e6,  price_change_percentage_24h:1.55,  price_change_percentage_7d:4.2,   market_cap_rank:13, ath:52.7,     circulating_supply:587e6,   max_supply:1e9     },
  { cmcId:6636,  symbol:"DOT",   name:"Polkadot",          current_price:7.41,       market_cap:1.05e10, total_volume:380e6,  price_change_percentage_24h:-0.92, price_change_percentage_7d:-2.3,  market_cap_rank:14, ath:55.0,     circulating_supply:1.42e9,  max_supply:null    },
  { cmcId:3890,  symbol:"POL",   name:"Polygon",           current_price:0.724,      market_cap:6.8e9,   total_volume:430e6,  price_change_percentage_24h:2.88,  price_change_percentage_7d:5.1,   market_cap_rank:16, ath:2.92,     circulating_supply:9.3e9,   max_supply:10e9    },
  { cmcId:7083,  symbol:"UNI",   name:"Uniswap",           current_price:10.34,      market_cap:6.2e9,   total_volume:290e6,  price_change_percentage_24h:1.21,  price_change_percentage_7d:3.8,   market_cap_rank:18, ath:44.9,     circulating_supply:600e6,   max_supply:1e9     },
  { cmcId:2,     symbol:"LTC",   name:"Litecoin",          current_price:84.2,       market_cap:6.3e9,   total_volume:560e6,  price_change_percentage_24h:-1.67, price_change_percentage_7d:-2.9,  market_cap_rank:19, ath:412,      circulating_supply:74e6,    max_supply:84e6    },
  { cmcId:3794,  symbol:"ATOM",  name:"Cosmos",            current_price:9.18,       market_cap:3.6e9,   total_volume:210e6,  price_change_percentage_24h:0.44,  price_change_percentage_7d:1.6,   market_cap_rank:23, ath:44.4,     circulating_supply:390e6,   max_supply:null    },
  { cmcId:6535,  symbol:"NEAR",  name:"NEAR Protocol",     current_price:6.82,       market_cap:7.3e9,   total_volume:440e6,  price_change_percentage_24h:3.74,  price_change_percentage_7d:8.2,   market_cap_rank:15, ath:20.4,     circulating_supply:1.07e9,  max_supply:null    },
  { cmcId:5994,  symbol:"SHIB",  name:"Shiba Inu",         current_price:0.0000248,  market_cap:1.46e10, total_volume:890e6,  price_change_percentage_24h:5.22,  price_change_percentage_7d:11.4,  market_cap_rank:11, ath:0.000088, circulating_supply:589e12,  max_supply:null    },
  { cmcId:1958,  symbol:"TRX",   name:"TRON",              current_price:0.123,      market_cap:1.08e10, total_volume:760e6,  price_change_percentage_24h:0.31,  price_change_percentage_7d:0.8,   market_cap_rank:12, ath:0.231,    circulating_supply:88e9,    max_supply:null    },
  { cmcId:512,   symbol:"XLM",   name:"Stellar",           current_price:0.114,      market_cap:3.3e9,   total_volume:130e6,  price_change_percentage_24h:-0.88, price_change_percentage_7d:-1.9,  market_cap_rank:25, ath:0.875,    circulating_supply:29e9,    max_supply:50e9    },
  { cmcId:328,   symbol:"XMR",   name:"Monero",            current_price:164,        market_cap:3.0e9,   total_volume:88e6,   price_change_percentage_24h:1.09,  price_change_percentage_7d:2.7,   market_cap_rank:27, ath:519,      circulating_supply:18.3e6,  max_supply:null    },
  { cmcId:8916,  symbol:"ICP",   name:"Internet Computer", current_price:12.1,       market_cap:5.6e9,   total_volume:120e6,  price_change_percentage_24h:-1.44, price_change_percentage_7d:-3.1,  market_cap_rank:20, ath:700,      circulating_supply:463e6,   max_supply:null    },
].map(c => ({
  ...c,
  image: cmcLogo(c.cmcId),
  sparkline_in_7d: { price: makeSpark(c.current_price) },
}));

// Pre-bake OHLC per coin (keyed by cmcId) for instant chart render
export const MOCK_OHLC = Object.fromEntries(
  MOCK_COINS.map(c => [c.cmcId, makeOHLC(c.current_price * 0.88)])
);

// ─────────────────────────────────────────────────────────────
//  API LAYER
//  All live calls route through FastAPI (which holds the CMC key).
//  Browser never touches the CMC API directly.
//  On any failure → silently renders demo / mock data.
// ─────────────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiTopCoins() {
  const r = await fetch(`${BASE}/api/markets`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  if (!Array.isArray(data) || !data.length) throw new Error("empty");
  return data;
}

async function apiOHLC(cmcId, days) {
  const r = await fetch(`${BASE}/api/history/${cmcId}?days=${days}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  if (!Array.isArray(data) || !data.length) throw new Error("empty");
  return data;
}

async function apiCorrelation() {
  const r = await fetch(`${BASE}/api/market/correlation`, {
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ─────────────────────────────────────────────────────────────
//  SPARKLINE  — pure SVG, zero dependencies
// ─────────────────────────────────────────────────────────────
export function Spark({ data, color = C.green, w = 80, h = 26 }) {
  if (!data || data.length < 2) return <svg width={w} height={h} />;
  const mn  = Math.min(...data);
  const mx  = Math.max(...data);
  const rng = mx - mn || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 2) - 1}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
      style={{ overflow:"visible", width:"100%", maxWidth:w, display:"block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  CANDLESTICK CHART  — Canvas 2D, HiDPI-aware
// ─────────────────────────────────────────────────────────────
export function CandleChart({ data, logScale }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !data?.length) return;
    const dpr = window.devicePixelRatio || 1;
    const W   = cv.clientWidth  || 420;
    const H   = cv.clientHeight || 240;
    cv.width  = W * dpr;
    cv.height = H * dpr;
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    const pad = { t:16, b:26, l:58, r:10 };
    const dw  = W - pad.l - pad.r;
    const dh  = H - pad.t - pad.b;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bgCard;
    ctx.fillRect(0, 0, W, H);

    const hi = data.map(d => d[2]);
    const lo = data.map(d => d[3]);
    let mn = Math.min(...lo);
    let mx = Math.max(...hi);
    if (logScale) { mn = Math.log10(Math.max(mn, 1e-9)); mx = Math.log10(Math.max(mx, 1e-9)); }
    const rng = mx - mn || 1;

    const toY = v => {
      const val = logScale ? Math.log10(Math.max(v, 1e-9)) : v;
      return pad.t + dh - ((val - mn) / rng) * dh;
    };

    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (dh / 4) * i;
      ctx.strokeStyle = "rgba(30,41,59,0.9)"; ctx.lineWidth = 0.5; ctx.setLineDash([3,6]);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.setLineDash([]);
      const val = logScale ? Math.pow(10, mx - (rng/4)*i) : mx - (rng/4)*i;
      const lbl = val>=1e9 ? `$${(val/1e9).toFixed(1)}B` : val>=1e6 ? `$${(val/1e6).toFixed(1)}M` : val>=1000 ? `$${(val/1000).toFixed(1)}k` : val>=0.001 ? `$${val.toFixed(2)}` : `$${val.toFixed(6)}`;
      ctx.fillStyle=C.silver; ctx.font=`8px 'Share Tech Mono'`; ctx.textAlign="right";
      ctx.fillText(lbl, pad.l - 4, y + 3);
    }

    const cw   = Math.max(2, Math.floor(dw / data.length * 0.62));
    const step = dw / Math.max(data.length - 1, 1);

    data.forEach((d, i) => {
      const [ts, o, h, l, c] = d;
      const x   = pad.l + i * step;
      const isUp = c >= o;
      const col  = isUp ? C.green : C.red;
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, toY(h)); ctx.lineTo(x, toY(l)); ctx.stroke();
      const y1 = toY(Math.max(o, c));
      const bh = Math.max(1.5, toY(Math.min(o, c)) - y1);
      if (i === data.length - 1) { ctx.shadowColor = col; ctx.shadowBlur = 8; }
      ctx.fillStyle = col; ctx.fillRect(x - cw/2, y1, cw, bh);
      ctx.shadowBlur = 0;
      if (i % Math.max(1, Math.floor(data.length / 5)) === 0) {
        const dt = new Date(ts);
        ctx.fillStyle="rgba(148,163,184,0.5)"; ctx.font=`7px 'Share Tech Mono'`; ctx.textAlign="center";
        ctx.fillText(`${dt.getMonth()+1}/${dt.getDate()}`, x, H - 5);
      }
    });
  }, [data, logScale]);

  return <canvas ref={ref} style={{ width:"100%", height:"100%", display:"block" }} />;
}

// ─────────────────────────────────────────────────────────────
//  PEARSON CORRELATION HEATMAP
// ─────────────────────────────────────────────────────────────
export function Heatmap({ assets, matrix }) {
  if (!assets || !matrix)
    return <div style={{ color:C.silver, fontSize:11, padding:20 }}>Computing correlations…</div>;

  const cell = v => {
    if (Math.abs(v) > 0.999) return { bg:"rgba(136,187,101,0.28)", col:C.green };
    if (v > 0) return { bg:`rgba(136,187,101,${(v*0.65).toFixed(2)})`, col: v > 0.5 ? C.bg : C.silver };
    return { bg:`rgba(59,130,246,${(Math.abs(v)*0.65).toFixed(2)})`, col: Math.abs(v) > 0.5 ? C.bg : C.silver };
  };

  const N = assets.length;
  return (
    <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
      <div style={{ display:"grid", gridTemplateColumns:`58px repeat(${N},1fr)`, gap:2, minWidth:Math.max(320, N*58+66) }}>
        <div />
        {assets.map(a => (
          <div key={a} style={{ textAlign:"center", fontSize:8, padding:"3px 2px", background:C.slate, color:C.silver, letterSpacing:1 }}>{a}</div>
        ))}
        {matrix.map((row, i) => [
          <div key={`lbl-${i}`} style={{ fontSize:8, display:"flex", alignItems:"center", padding:"0 4px", background:C.slate, color:C.silver }}>{assets[i]}</div>,
          ...row.map((v, j) => {
            const { bg, col } = cell(v);
            return (
              <div key={`${i}-${j}`}
                style={{ background:bg, color:col, height:32, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, cursor:"crosshair", transition:"transform 0.12s" }}
                title={`${assets[i]} vs ${assets[j]}: ${v.toFixed(3)}`}
                onMouseEnter={e => { e.currentTarget.style.transform="scale(1.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
              >
                {v.toFixed(2)}
              </div>
            );
          }),
        ])}
      </div>
      <div style={{ fontSize:8, color:"rgba(59,130,246,0.42)", marginTop:7, letterSpacing:1 }}>
        * PEARSON_R · 7D PRICE SERIES · TOP 6 ASSETS BY MKT CAP
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  COIN CARD  — grid tile
// ─────────────────────────────────────────────────────────────
export function CoinCard({ coin, onClick, idx }) {
  const [hov, setHov] = useState(false);
  const chg = coin.price_change_percentage_24h || 0;
  const up  = chg >= 0;
  const p   = coin.current_price;
  const fmt =
    p >= 1000   ? `$${p.toLocaleString(undefined,{maximumFractionDigits:0})}` :
    p >= 1      ? `$${p.toFixed(2)}`  :
    p >= 0.0001 ? `$${p.toFixed(5)}`  :
                  `$${p.toFixed(8)}`;

  return (
    <div
      className="coin-card pop"
      style={{
        padding:"11px 10px", cursor:"pointer",
        background:C.bgCard,
        border:`1px solid ${hov ? (up ? C.green : C.red) : "rgba(136,187,101,0.17)"}`,
        borderLeft:`3px solid ${up ? C.green : C.red}`,
        boxShadow: hov ? `0 0 15px ${up ? C.greenGlow : "rgba(239,68,68,0.27)"}` : "none",
        transition:"all 0.18s",
        animationDelay:`${idx*0.028}s`,
        position:"relative", overflow:"hidden",
      }}
      onClick={() => onClick(coin)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onTouchStart={() => setHov(true)}
      onTouchEnd={()   => setHov(false)}
    >
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(136,187,101,0.022),transparent 55%)", pointerEvents:"none" }} />

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:7 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <img src={coin.image} width={20} height={20}
            style={{ borderRadius:"50%", flexShrink:0 }} alt={coin.symbol}
            onError={e => { e.target.style.display="none"; }} />
          <div>
            <div style={{ fontSize:10, fontWeight:"bold", letterSpacing:1, color:C.white }}>{coin.symbol?.toUpperCase()}</div>
            <div style={{ fontSize:7, color:C.silver }}>#{coin.market_cap_rank}</div>
          </div>
        </div>
        <span style={{ fontSize:8, color: up ? C.green : C.red }}>
          {up?"▲":"▼"}{Math.abs(chg).toFixed(2)}%
        </span>
      </div>

      <div style={{
        fontSize:"clamp(10px,2.8vw,14px)",
        fontFamily:"Orbitron,monospace",
        fontWeight:700,
        color: up ? C.green : C.white,
        marginBottom:7, wordBreak:"break-all",
      }}>
        {fmt}
      </div>

      <Spark data={coin.sparkline_in_7d?.price} color={up ? C.green : C.red} w={110} h={22} />
      <div style={{ fontSize:7, color:"rgba(148,163,184,0.36)", marginTop:4 }}>
        ${((coin.market_cap||0)/1e9).toFixed(1)}B MKT
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ANALYTICS DRAWER
// ─────────────────────────────────────────────────────────────
export function Drawer({ coin, onClose, corrAssets, corrMatrix }) {
  const [tab,      setTab]      = useState("candle");
  const [days,     setDays]     = useState(30);
  const [ohlc,     setOhlc]     = useState(null);
  const [ohlcLoad, setOhlcLoad] = useState(false);

  const logScale = tab === "log";
  const chg      = coin.price_change_percentage_24h || 0;
  const up       = chg >= 0;

  const loadChart = useCallback((id, d) => {
    setOhlcLoad(true);
    setOhlc(null);
    apiOHLC(id, d)
      .then(data => { setOhlc(data); setOhlcLoad(false); })
      .catch(() => {
        setOhlc(MOCK_OHLC[id] || makeOHLC(coin.current_price * 0.9, 30));
        setOhlcLoad(false);
      });
  }, [coin.current_price]);

  useEffect(() => {
    if (tab === "candle" || tab === "log") loadChart(coin.cmcId, days);
  }, [coin.cmcId, days, tab, loadChart]);

  const stats = [
    ["PRICE",      `$${coin.current_price?.toLocaleString()}`,                                                                    C.white ],
    ["24H CHG",    `${up?"+":""}${chg.toFixed(2)}%`,                                                                              up ? C.green : C.red],
    ["MKT CAP",    `$${((coin.market_cap||0)/1e9).toFixed(2)}B`,                                                                  C.green ],
    ["24H VOL",    `$${((coin.total_volume||0)/1e9).toFixed(2)}B`,                                                                C.blue  ],
    ["ATH",        coin.ath ? `$${coin.ath.toLocaleString()}` : "—",                                                              C.green ],
    ["RANK",       `#${coin.market_cap_rank}`,                                                                                    C.blue  ],
    ["C. SUPPLY",  coin.circulating_supply ? `${(coin.circulating_supply/1e6).toFixed(1)}M` : "—",                               C.silver],
    ["MAX SUPPLY", coin.max_supply         ? `${(coin.max_supply/1e6).toFixed(1)}M` : "∞",                                       C.silver],
    ["7D CHG",     `${(coin.price_change_percentage_7d||0)>=0?"+":""}${(coin.price_change_percentage_7d||0).toFixed(2)}%`,
                   (coin.price_change_percentage_7d||0) >= 0 ? C.green : C.red],
    ["CMC ID",     `#${coin.cmcId}`,                                                                                              C.silver],
  ];

  return (
    <div className="drawer-wrap" onClick={onClose}>
      <div className="drawer-backdrop" />
      <div className="drawer-panel" style={{ background:C.bgModal }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding:"12px 15px",
          borderBottom:`1px solid rgba(136,187,101,0.14)`,
          display:"flex", alignItems:"center", gap:10,
          position:"sticky", top:0, background:C.bgModal, zIndex:10,
        }}>
          <img src={coin.image} width={30} height={30}
            style={{ borderRadius:"50%", border:`2px solid ${up?C.green:C.red}`, flexShrink:0 }}
            alt={coin.name} onError={e => { e.target.style.display="none"; }} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"Orbitron,monospace", fontSize:"clamp(12px,3.5vw,16px)", fontWeight:700, letterSpacing:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {coin.name}
            </div>
            <div className="tag">{coin.symbol?.toUpperCase()} / USD</div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontFamily:"Orbitron,monospace", fontSize:"clamp(13px,3.5vw,17px)", fontWeight:900, color: up?C.green:C.red }}>
              ${coin.current_price?.toLocaleString(undefined,{ minimumFractionDigits:2, maximumFractionDigits:coin.current_price>=1?2:6 })}
            </div>
            <div style={{ fontSize:9, color:up?C.green:C.red }}>{up?"▲":"▼"}{Math.abs(chg).toFixed(2)}% 24H</div>
          </div>
          <button onClick={onClose}
            style={{ background:"none", border:"none", color:C.silver, cursor:"pointer", fontSize:19, padding:"0 3px", lineHeight:1, flexShrink:0 }}>✕</button>
        </div>

        {/* Tabs */}
        <div className="tab-nav">
          {[["candle","📈 CANDLE"],["log","〽 LOG"],["heatmap","⬛ HEAT"],["stats","📊 STATS"]].map(([t,l]) => (
            <button key={t} className={`btn ${tab===t?"on":""}`} style={{ fontSize:9, padding:"5px 11px" }} onClick={() => setTab(t)}>{l}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding:14 }}>

          {(tab==="candle"||tab==="log") && (
            <>
              <div style={{ display:"flex", gap:5, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
                <span className="tag" style={{ fontSize:7 }}>PERIOD:</span>
                {[7,14,30,90].map(d => (
                  <button key={d} className={`btn bd ${days===d?"on":""}`} style={{ fontSize:9, padding:"4px 9px" }} onClick={() => setDays(d)}>{d}D</button>
                ))}
                <span style={{ marginLeft:"auto", fontSize:7, color:"rgba(136,187,101,0.32)", letterSpacing:1 }}>
                  {logScale?"LOG₁₀":"LINEAR"} · {ohlc?.length||"—"} CANDLES
                </span>
              </div>
              <div style={{ position:"relative", height:"clamp(175px,38vw,285px)", background:C.bgCard, border:`1px solid rgba(136,187,101,0.1)` }}>
                {ohlcLoad && (
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(2,8,23,0.7)", zIndex:5 }}>
                    <span className="spin" style={{ fontSize:22, color:C.green }}>◌</span>
                  </div>
                )}
                {ohlc && <CandleChart data={ohlc} logScale={logScale} />}
              </div>
              {tab==="log" && (
                <div style={{ marginTop:8, padding:9, background:C.bgDark, border:`1px solid rgba(59,130,246,0.17)`, fontSize:9, color:C.silver, lineHeight:1.8 }}>
                  <span style={{ color:C.blue }}>LOG_SCALE: </span>
                  Y = log₁₀(price) — equal vertical space = equal % move. Ideal for spotting cycles and parabolic runs.
                </div>
              )}
            </>
          )}

          {tab==="heatmap" && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
                <span style={{ fontFamily:"Orbitron,monospace", fontSize:10, color:C.green, letterSpacing:2 }}>CORRELATION_MATRIX</span>
                <div style={{ fontSize:8, display:"flex", gap:10 }}>
                  <span style={{ color:C.green }}>▮ POSITIVE</span>
                  <span style={{ color:C.blue }}>▮ NEGATIVE</span>
                </div>
              </div>
              <Heatmap assets={corrAssets} matrix={corrMatrix} />
              <div style={{ marginTop:12, padding:10, background:C.bgDark, border:`1px solid rgba(59,130,246,0.14)`, fontSize:9, color:C.silver, lineHeight:1.8 }}>
                <div style={{ color:C.blue, letterSpacing:1, marginBottom:3 }}>GUIDE</div>
                <div>+1.00 = lockstep &nbsp;·&nbsp; 0.00 = independent &nbsp;·&nbsp; −1.00 = inverse hedge</div>
                <div style={{ color:"rgba(136,187,101,0.42)", marginTop:3 }}>Green sea = correlated risk. Blue patches = potential hedge pairs.</div>
              </div>
            </>
          )}

          {tab==="stats" && (
            <>
              <div className="stats-grid" style={{ marginBottom:12 }}>
                {stats.map(([l,v,col]) => (
                  <div key={l} style={{ background:C.bgDark, border:`1px solid rgba(136,187,101,0.1)`, padding:"9px 11px" }}>
                    <div className="tag" style={{ fontSize:7 }}>{l}</div>
                    <div style={{ fontSize:12, marginTop:4, fontFamily:"Orbitron,monospace", color:col, wordBreak:"break-all" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:C.bgDark, border:`1px solid rgba(136,187,101,0.1)`, padding:12 }}>
                <div className="tag" style={{ fontSize:7, marginBottom:7 }}>7D SPARKLINE</div>
                <Spark data={coin.sparkline_in_7d?.price} color={up?C.green:C.red} w={500} h={48} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  COMMAND PALETTE  (Ctrl+K / Cmd+K)
// ─────────────────────────────────────────────────────────────
export function CmdPalette({ open, onClose, coins, onSelect }) {
  const [q, setQ] = useState("");
  const ref       = useRef(null);

  useEffect(() => {
    if (open) { setQ(""); setTimeout(() => ref.current?.focus(), 55); }
  }, [open]);

  if (!open) return null;

  const hits = coins
    .filter(c =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.symbol.toLowerCase().includes(q.toLowerCase())
    )
    .slice(0, 10);

  return (
    <div className="cmd-wrap" onClick={onClose}>
      <div className="cmd-backdrop" />
      <div className="cmd-box" onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", padding:"12px 15px", borderBottom:`1px solid rgba(136,187,101,0.16)`, gap:10 }}>
          <span style={{ color:C.green, fontSize:13 }}>⌘</span>
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)}
            placeholder="SEARCH ASSET…" style={{ flex:1, fontSize:13, letterSpacing:1 }} autoFocus />
          <span style={{ fontSize:8, color:C.silver, letterSpacing:2 }}>ESC</span>
        </div>
        <div style={{ maxHeight:"52vh", overflowY:"auto" }}>
          {hits.length === 0 && (
            <div style={{ padding:20, color:C.silver, fontSize:11, textAlign:"center", letterSpacing:2 }}>NO_RESULTS</div>
          )}
          {hits.map(c => {
            const up = (c.price_change_percentage_24h||0) >= 0;
            return (
              <div key={c.cmcId}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 15px", cursor:"pointer", borderBottom:`1px solid rgba(136,187,101,0.06)`, transition:"background 0.12s" }}
                onClick={() => { onSelect(c); onClose(); }}
                onMouseEnter={e => { e.currentTarget.style.background=C.greenDim; }}
                onMouseLeave={e => { e.currentTarget.style.background="transparent"; }}
              >
                <img src={c.image} width={20} height={20}
                  style={{ borderRadius:"50%", flexShrink:0 }} alt={c.name}
                  onError={e => { e.target.style.display="none"; }} />
                <span style={{ flex:1, fontSize:12 }}>{c.name}</span>
                <span style={{ fontSize:9, color:C.silver }}>{c.symbol?.toUpperCase()}</span>
                <span style={{ fontSize:11, color:up?C.green:C.red }}>${c.current_price?.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
        <div style={{ padding:"6px 15px", borderTop:`1px solid rgba(136,187,101,0.07)`, fontSize:8, color:"rgba(136,187,101,0.32)", letterSpacing:2 }}>
          CTRL+K TOGGLE · CLICK TO ANALYZE · ESC CLOSE
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  CLIENT-SIDE PEARSON  (7D sparkline fallback)
// ─────────────────────────────────────────────────────────────
function computePearsonMatrix(coins) {
  const top = coins.slice(0, 6).filter(c => c.sparkline_in_7d?.price?.length > 6);
  if (top.length < 2) return { assets:null, matrix:null };
  const syms   = top.map(c => c.symbol.toUpperCase());
  const series = top.map(c => c.sparkline_in_7d.price);
  const pearson = (a, b) => {
    const n=a.length, ma=a.reduce((s,v)=>s+v,0)/n, mb=b.reduce((s,v)=>s+v,0)/n;
    let num=0,da=0,db=0;
    for(let i=0;i<n;i++){const ea=a[i]-ma,eb=b[i]-mb;num+=ea*eb;da+=ea*ea;db+=eb*eb;}
    return da&&db?num/Math.sqrt(da*db):0;
  };
  return {
    assets: syms,
    matrix: series.map(a => series.map(b => parseFloat(pearson(a,b).toFixed(3)))),
  };
}

// ─────────────────────────────────────────────────────────────
//  ROOT DASHBOARD
// ─────────────────────────────────────────────────────────────
export default function CryptoDashboard() {
  const [coins,      setCoins]      = useState(MOCK_COINS);
  const [isLive,     setIsLive]     = useState(false);
  const [liveErr,    setLiveErr]    = useState(false);
  const [fetching,   setFetching]   = useState(true);
  const [drawer,     setDrawer]     = useState(null);
  const [cmdOpen,    setCmdOpen]    = useState(false);
  const [corrAssets, setCorrAssets] = useState(null);
  const [corrMatrix, setCorrMatrix] = useState(null);
  const [time,       setTime]       = useState(new Date());
  const [filter,     setFilter]     = useState("all");
  const [sort,       setSort]       = useState("rank");

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const h = e => {
      if ((e.ctrlKey||e.metaKey) && e.key==="k") { e.preventDefault(); setCmdOpen(v=>!v); }
      if (e.key==="Escape") { setCmdOpen(false); setDrawer(null); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Live data fetch (CMC via FastAPI)
  const tryLiveFetch = useCallback(() => {
    setFetching(true);
    setLiveErr(false);
    apiTopCoins()
      .then(data => { setCoins(data); setIsLive(true); setLiveErr(false); setFetching(false); })
      .catch(() => { setIsLive(false); setLiveErr(true); setFetching(false); });
  }, []);

  useEffect(() => {
    tryLiveFetch();
    const t = setInterval(tryLiveFetch, 30_000);
    return () => clearInterval(t);
  }, [tryLiveFetch]);

  // Correlation matrix
  useEffect(() => {
    apiCorrelation()
      .then(res => {
        if (res?.assets && res?.matrix) { setCorrAssets(res.assets); setCorrMatrix(res.matrix); }
        else throw new Error("empty");
      })
      .catch(() => {
        const { assets, matrix } = computePearsonMatrix(coins);
        setCorrAssets(assets); setCorrMatrix(matrix);
      });
  }, [coins]);

  // Derived display list
  const displayed = [...coins]
    .filter(c =>
      filter==="all"     ? true :
      filter==="gainers" ? (c.price_change_percentage_24h||0) >= 0 :
                           (c.price_change_percentage_24h||0) < 0
    )
    .sort((a,b) =>
      sort==="price"  ? b.current_price - a.current_price :
      sort==="change" ? (b.price_change_percentage_24h||0)-(a.price_change_percentage_24h||0) :
                        a.market_cap_rank - b.market_cap_rank
    );

  const topG      = [...coins].sort((a,b) => (b.price_change_percentage_24h||0)-(a.price_change_percentage_24h||0))[0];
  const topL      = [...coins].sort((a,b) => (a.price_change_percentage_24h||0)-(b.price_change_percentage_24h||0))[0];
  const totalMcap = coins.reduce((s,c) => s+(c.market_cap||0), 0);

  return (
    <>
      <div className="scanbar" />
      <div className="crt-overlay" />

      <CmdPalette open={cmdOpen} onClose={() => setCmdOpen(false)} coins={coins}
        onSelect={c => { setDrawer(c); setCmdOpen(false); }} />
      {drawer && (
        <Drawer coin={drawer} onClose={() => setDrawer(null)}
          corrAssets={corrAssets} corrMatrix={corrMatrix} />
      )}

      {/* HEADER */}
      <header className="site-header">
        <div className="header-brand">
          <h1 className="glitch-title" data-text="CRYPTEX">CRYPTEX</h1>
          <span className="version-badge">v2.2</span>
        </div>
        <div className="header-actions">
          <span className="header-clock">{time.toUTCString().slice(0,-4)} UTC</span>
          <button className="btn" onClick={() => setCmdOpen(true)}>⌘ SEARCH</button>
          <div className="live-indicator">
            <span className="live-dot" style={{ background: isLive ? C.green : C.silver }} />
            <span style={{ color: isLive ? C.green : C.silver }}>{isLive ? "LIVE" : "DEMO"}</span>
          </div>
        </div>
      </header>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...coins,...coins].map((c,i) => {
            const up = (c.price_change_percentage_24h||0) >= 0;
            return (
              <span key={i} className="ticker-item" style={{ color: up?C.green:C.red }}>
                {c.symbol?.toUpperCase()} ${c.current_price?.toLocaleString()} {up?"▲":"▼"}{Math.abs(c.price_change_percentage_24h||0).toFixed(2)}%
              </span>
            );
          })}
        </div>
      </div>

      {/* DEMO BANNER */}
      {liveErr && (
        <div className="demo-banner">
          <span>
            <span style={{ color:C.blue }}>ℹ </span>
            CMC API UNAVAILABLE — DISPLAYING DEMO DATA
            <span className="banner-sub"> (set CMC_API_KEY in backend .env)</span>
          </span>
          <button className="btn bd" style={{ fontSize:9, padding:"3px 12px" }}
            onClick={e => { e.stopPropagation(); tryLiveFetch(); }}>
            {fetching ? "RETRYING…" : "↺ RETRY LIVE"}
          </button>
        </div>
      )}

      {/* MARKET SUMMARY */}
      <div className="market-bar">
        {[
          ["TOTAL MKT CAP", `$${(totalMcap/1e12).toFixed(2)}T`,                                                            C.white],
          ["TOP GAINER",    topG?`${topG.symbol?.toUpperCase()} +${topG.price_change_percentage_24h?.toFixed(1)}%`:"—",   C.green],
          ["TOP LOSER",     topL?`${topL.symbol?.toUpperCase()} ${topL.price_change_percentage_24h?.toFixed(1)}%` :"—",   C.red  ],
          ["ASSETS",        `${coins.length} TRACKED`,                                                                      C.blue ],
        ].map(([l,v,col]) => (
          <div key={l} className="market-stat">
            <div className="tag">{l}</div>
            <div className="market-stat-value" style={{ color:col }}>{v}</div>
          </div>
        ))}
      </div>

      {/* MAIN */}
      <main className="main-content">
        <div className="toolbar">
          <div className="toolbar-filters">
            {[["all","ALL"],["gainers","▲ GAIN"],["losers","▼ LOSS"]].map(([v,l]) => (
              <button key={v} className={`btn ${filter===v?"on":""}`} style={{ fontSize:9, padding:"4px 11px" }} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <div className="toolbar-sort">
            <span className="tag" style={{ fontSize:7 }}>SORT:</span>
            {[["rank","RANK"],["change","24H%"],["price","PRICE"]].map(([v,l]) => (
              <button key={v} className={`btn bd ${sort===v?"on":""}`} style={{ fontSize:9, padding:"4px 9px" }} onClick={() => setSort(v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="usage-hint">
          <span style={{ color:C.green, fontSize:11 }}>↗</span>
          TAP ANY CARD TO OPEN ANALYTICS · CTRL+K TO SEARCH
        </div>

        {fetching && coins.length === 0 && (
          <div className="loading-state">
            <div className="spin" style={{ fontSize:28, color:C.green }}>◌</div>
            <div style={{ marginTop:12, letterSpacing:3, fontSize:11 }}>LOADING…</div>
          </div>
        )}

        <div className="coin-grid">
          {displayed.map((c,i) => <CoinCard key={c.cmcId} coin={c} idx={i} onClick={setDrawer} />)}
        </div>

        {displayed.length === 0 && <div className="empty-state">NO_ASSETS_MATCH_FILTER</div>}
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <span className="footer-left">
          CRYPTEX v2.2 · {isLive ? "COINMARKETCAP LIVE · 30s REFRESH" : "DEMO MODE · SIMULATED DATA"}
        </span>
        <span className="footer-right">NOT_FINANCIAL_ADVICE</span>
      </footer>
    </>
  );
}
