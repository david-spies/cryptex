// frontend/tailwind.config.js
// =============================================================
//  CRYPTEX v2.2 — Tailwind CSS Configuration
//  Extends the default theme with the "Tech-Noir Glitch" design
//  system: colors, fonts, animations, shadows, and keyframes.
// =============================================================

/** @type {import('tailwindcss').Config} */
module.exports = {
  // ── Content paths — tells Tailwind which files to scan for classes ──
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    // App Router support (Next.js 13+)
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  // ── Dark mode — use class strategy so we can toggle programmatically ──
  darkMode: "class",

  theme: {
    extend: {
      // ── Colors ──────────────────────────────────────────────
      colors: {
        // Deep noir backgrounds
        noir: {
          DEFAULT: "#020817",   // deepest background
          card:    "#0a1628",   // card surface
          dark:    "#060f1e",   // sidebar, footer, inputs
          modal:   "#0d1f38",   // drawer / overlay panels
          slate:   "#1e293b",   // heatmap headers, dividers
        },

        // Solarized Green — primary accent
        "solar-green": {
          DEFAULT: "#88bb65",
          dim:     "rgba(136, 187, 101, 0.13)",
          glow:    "rgba(136, 187, 101, 0.38)",
          50:      "#f3f9ee",
          100:     "#e2f1d4",
          200:     "#c4e3a9",
          300:     "#a3d07c",
          400:     "#88bb65",   // ← DEFAULT
          500:     "#6da048",
          600:     "#547d38",
          700:     "#3f5f2a",
          800:     "#2b401c",
          900:     "#18250f",
        },

        // Slate Blue — secondary accent
        "slate-blue": {
          DEFAULT: "#3b82f6",
          dim:     "rgba(59, 130, 246, 0.13)",
          glow:    "rgba(59, 130, 246, 0.38)",
          50:      "#eff6ff",
          100:     "#dbeafe",
          200:     "#bfdbfe",
          300:     "#93c5fd",
          400:     "#60a5fa",
          500:     "#3b82f6",   // ← DEFAULT
          600:     "#2563eb",
          700:     "#1d4ed8",
          800:     "#1e40af",
          900:     "#1e3a8a",
        },

        // Text hierarchy
        "base-white":  "#f8fafc",
        "base-silver": "#94a3b8",
        "base-red":    "#ef4444",
      },

      // ── Typography ───────────────────────────────────────────
      fontFamily: {
        // Orbitron — display font for prices, headings, data values
        display: ["Orbitron", "ui-monospace", "monospace"],
        // Share Tech Mono — body, labels, buttons
        mono:    ["Share Tech Mono", "ui-monospace", "Courier New", "monospace"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],  // 10px
        "3xs": ["0.5rem",   { lineHeight: "0.75rem"}], // 8px
      },

      // ── Letter Spacing ───────────────────────────────────────
      letterSpacing: {
        "terminal": "0.2em",
        "widest-2": "0.3em",
      },

      // ── Box Shadows (neon glow effects) ──────────────────────
      boxShadow: {
        "neon-green":    "0 0 5px #88bb65, 0 0 20px rgba(136,187,101,0.35)",
        "neon-green-lg": "0 0 10px #88bb65, 0 0 40px rgba(136,187,101,0.4), 0 0 80px rgba(136,187,101,0.15)",
        "neon-blue":     "0 0 5px #3b82f6, 0 0 20px rgba(59,130,246,0.35)",
        "neon-blue-lg":  "0 0 10px #3b82f6, 0 0 40px rgba(59,130,246,0.4),  0 0 80px rgba(59,130,246,0.15)",
        "neon-red":      "0 0 5px #ef4444, 0 0 20px rgba(239,68,68,0.35)",
        "card":          "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)",
        "drawer":        "0 -10px 45px rgba(136,187,101,0.38)",
        "modal":         "0 25px 50px rgba(0,0,0,0.8), 0 0 40px rgba(136,187,101,0.15)",
      },

      // ── Border Radius ────────────────────────────────────────
      borderRadius: {
        "none-px": "1px",  // very slight rounding for tech aesthetic
      },

      // ── Backdrop Blur ────────────────────────────────────────
      backdropBlur: {
        xs: "2px",
      },

      // ── Animations ───────────────────────────────────────────
      animation: {
        // Continuous effects
        "glitch":   "glitch 3.5s linear infinite",
        "flicker":  "flicker 7s infinite",
        "scanline": "scanline 9s linear infinite",
        "blink":    "blink 1.1s infinite",
        "marquee":  "marquee 55s linear infinite",
        "spin-slow":"spin 2s linear infinite",

        // One-shot entrances
        "rise":     "rise 0.35s ease both",
        "pop-in":   "popIn 0.28s ease both",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in":  "fadeIn 0.22s ease",

        // Attention
        "neon-pulse": "neonPulse 2s ease-in-out infinite",
      },

      // ── Keyframes ────────────────────────────────────────────
      keyframes: {
        glitch: {
          "0%,100%": { clipPath: "inset(0 0 100% 0)", transform: "translate(0)" },
          "10%":     { clipPath: "inset(10% 0 60% 0)", transform: "translate(-3px,  1px)" },
          "20%":     { clipPath: "inset(50% 0 30% 0)", transform: "translate( 3px, -1px)" },
          "30%":     { clipPath: "inset(20% 0 70% 0)", transform: "translate(-2px,  2px)" },
          "40%":     { clipPath: "inset(70% 0 10% 0)", transform: "translate( 2px, -2px)" },
          "50%":     { clipPath: "inset(0 0 0 0)",     transform: "translate(0)" },
        },

        flicker: {
          "0%,100%": { opacity: "1" },
          "92%":     { opacity: "1" },
          "93%":     { opacity: "0.30" },
          "94%":     { opacity: "1" },
          "96%":     { opacity: "0.55" },
          "97%":     { opacity: "1" },
        },

        scanline: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },

        blink: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0" },
        },

        marquee: {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },

        rise: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },

        slideUp: {
          from: { transform: "translateY(100%)" },
          to:   { transform: "translateY(0)" },
        },

        popIn: {
          from: { opacity: "0", transform: "scale(0.95) translateY(6px)" },
          to:   { opacity: "1", transform: "scale(1)    translateY(0)" },
        },

        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },

        neonPulse: {
          "0%,100%": { boxShadow: "0 0 4px #88bb65" },
          "50%":     { boxShadow: "0 0 16px #88bb65, 0 0 32px rgba(136,187,101,0.38)" },
        },
      },

      // ── Spacing extras ───────────────────────────────────────
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },

      // ── Max Width ────────────────────────────────────────────
      maxWidth: {
        "8xl":  "88rem",
        "9xl":  "96rem",
        "10xl": "112rem",
      },

      // ── Z-Index ──────────────────────────────────────────────
      zIndex: {
        "60":  "60",
        "70":  "70",
        "80":  "80",
        "90":  "90",
        "100": "100",
        "200": "200",
        "300": "300",
        "9998": "9998",
        "9999": "9999",
      },

      // ── Transition durations ─────────────────────────────────
      transitionDuration: {
        "150": "150ms",
        "250": "250ms",
      },
    },
  },

  plugins: [
    // Uncomment to enable official Tailwind plugins as needed:
    // require("@tailwindcss/forms"),
    // require("@tailwindcss/typography"),
    // require("@tailwindcss/aspect-ratio"),
    // require("@tailwindcss/container-queries"),
  ],
};
