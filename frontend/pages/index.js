// frontend/pages/index.js
// =============================================================
//  CRYPTEX — Next.js Page Entry Point
//  Route: / (home)
//  Fix applied: React Hydration Robust Fix (useEffect)
// =============================================================

import { useState, useEffect } from "react";
import Head from "next/head";
import CryptoDashboard from "../components/CryptoDashboard";

export default function HomePage() {
  // --- Robust Hydration Fix ---
  // This state ensures the component only renders the full UI 
  // after it has mounted on the client.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Head>
        {/* Primary meta */}
        <title>CRYPTEX — Real-Time Crypto Analytics</title>
        <meta name="description" content="Tech-noir cryptocurrency analysis dashboard. Live prices, candlestick charts, log-scale views, and Pearson correlation heatmaps for 20 top assets. Powered by CoinMarketCap." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#020817" />

        {/* Open Graph */}
        <meta property="og:title" content="CRYPTEX — Real-Time Crypto Analytics" />
        <meta property="og:description" content="Live prices, candlestick charts, log-scale views, and correlation heatmaps — powered by CoinMarketCap." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_SITE_URL || "https://cryptex.app"} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CRYPTEX — Real-Time Crypto Analytics" />
        <meta name="twitter:description" content="Live prices, candlestick charts, log-scale, and correlation heatmaps. Powered by CoinMarketCap." />
        <meta name="twitter:image" content="/og-image.png" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Note: Moving Google Fonts to globals.css is recommended 
            to avoid the "next/head" warning in your terminal.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main style={{ minHeight: '100vh', backgroundColor: '#020817' }}>
        {/* Only render the Dashboard once mounted. 
            This prevents the 'Text content does not match' error 
            caused by real-time clocks or dynamic data.
        */}
        {mounted ? (
          <CryptoDashboard />
        ) : (
          <div className="loading-placeholder" style={{ color: '#00f2ff', fontFamily: 'Orbitron', textAlign: 'center', paddingTop: '20vh' }}>
            INITIALIZING CRYPTEX SYSTEMS...
          </div>
        )}
      </main>
    </>
  );
}

export async function getStaticProps() {
  return {
    props: {},
    revalidate: 60,
  };
}
