// app/globe/page.jsx
// Page principale du Globe LISN
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import LisnWordmark from "@/components/lisn/LisnWordmark";

// Import dynamique — Three.js ne peut pas tourner côté serveur
const GlobeScene = dynamic(
  () => import("@/components/globe/GlobeScene"),
  { ssr: false, loading: () => (
    <div className="globe-loading">
      <div className="lisn-live-orb orb-scanning" />
    </div>
  )}
);

export default function GlobePage() {
  const [lang, setLang]               = useState("fr");
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [dark, setDark]               = useState(true); // Globe = dark par défaut

  return (
    <main
      className="globe-page"
      data-theme={dark ? "dark" : "light"}
    >
      {/* Header minimal */}
      <header className="globe-header">
        <a href="/" className="globe-wordmark">
          <LisnWordmark />
        </a>

        <div className="globe-header-controls">
          <button
            className="globe-lang-btn"
            onClick={() => setLang(l => l === "fr" ? "en" : "fr")}
          >
            {lang === "fr" ? "EN" : "FR"}
          </button>
          <button
            className="globe-theme-btn"
            onClick={() => setDark(d => !d)}
          >
            {dark ? "☀" : "◑"}
          </button>
          <a href="/" className="globe-home-btn">
            ← {lang === "fr" ? "Analyse" : "Analyze"}
          </a>
        </div>
      </header>

      {/* Globe */}
     <GlobeScene works={displayWorks} dark={dark} />

      {/* Footer minimal */}
      <footer className="globe-footer">
        <span className="globe-footer-text">
          {lang === "fr"
            ? "Chaque point est une œuvre. Sa position est déterminée par sa structure."
            : "Every point is a work. Its position is determined by its structure."}
        </span>
      </footer>
    </main>
  );
}
