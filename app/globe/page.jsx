"use client";

import { useEffect, useMemo, useState } from "react";
import GlobeScene from "@/components/globe/GlobeScene";

function clampWorks(works) {
  return (works || []).map((w) => ({
    ...w,
    x: Math.max(-0.82, Math.min(0.82, w.x ?? 0)),
    y: Math.max(-0.82, Math.min(0.82, w.y ?? 0)),
    z: Math.max(-0.82, Math.min(0.82, w.z ?? 0)),
    size: Math.max(0.025, Math.min(0.07, w.size ?? 0.04)),
  }));
}

export default function GlobePage() {
  const [dark, setDark] = useState(true);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadWorks() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/globe");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Erreur chargement globe");
        }

        if (alive) {
          setWorks(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (alive) {
          setError(e.message || "Erreur inconnue");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadWorks();

    return () => {
      alive = false;
    };
  }, []);

  const displayWorks = useMemo(() => clampWorks(works), [works]);

  return (
    <main className="globe-page" data-theme={dark ? "dark" : "light"}>
      <button
        type="button"
        className="globe-theme-toggle"
        onClick={() => setDark((v) => !v)}
      >
        {dark ? "Light" : "Dark"}
      </button>

      <div className="globe-shell">
        <div className="globe-stage">
          <GlobeScene works={displayWorks} dark={dark} />
        </div>

        <aside className="globe-sidebar">
          <div className="globe-kicker">LISN</div>
          <h1 className="globe-title">Music as terrain</h1>
          <p className="globe-text">
            Pour l’instant, le globe affiche les œuvres du seed comme données mock.
            Les vraies positions OSR viendront plus tard.
          </p>

          <div className="globe-legend">
            <div className="globe-legend-item">
              <span
                className="globe-legend-swatch"
                style={{ background: "#5cb7ff" }}
              />
              <span>Harmonic</span>
            </div>
            <div className="globe-legend-item">
              <span
                className="globe-legend-swatch"
                style={{ background: "#7ce8a6" }}
              />
              <span>Groove</span>
            </div>
            <div className="globe-legend-item">
              <span
                className="globe-legend-swatch"
                style={{ background: "#cc8cff" }}
              />
              <span>Textural</span>
            </div>
            <div className="globe-legend-item">
              <span
                className="globe-legend-swatch"
                style={{ background: "#ff9a5c" }}
              />
              <span>Narrative</span>
            </div>
            <div className="globe-legend-item">
              <span
                className="globe-legend-swatch"
                style={{ background: "#f2eee8" }}
              />
              <span>Formal</span>
            </div>
          </div>

          <div style={{ marginTop: 24, fontSize: 14, opacity: 0.8 }}>
            {loading && <div>Loading works…</div>}
            {!loading && !error && <div>{displayWorks.length} œuvres affichées</div>}
            {!loading && error && <div>Erreur: {error}</div>}
          </div>
        </aside>
      </div>
    </main>
  );
}