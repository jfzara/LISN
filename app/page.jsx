"use client";

import { useMemo, useState } from "react";
import GlobeScene from "@/components/globe/GlobeScene";

const demoWorks = [
  {
    id: "radiohead-okc",
    title: "OK Computer",
    artist: "Radiohead",
    x: 0.42,
    y: 0.18,
    z: -0.24,
    size: 0.055,
    color: "#5cb7ff",
  },
  {
    id: "eno-airports",
    title: "Music for Airports",
    artist: "Brian Eno",
    x: -0.35,
    y: -0.08,
    z: -0.46,
    size: 0.05,
    color: "#6f86ff",
  },
  {
    id: "daft-punk-ram",
    title: "Random Access Memories",
    artist: "Daft Punk",
    x: 0.28,
    y: -0.12,
    z: 0.38,
    size: 0.052,
    color: "#65f0b5",
  },
  {
    id: "kendrick-tpab",
    title: "To Pimp a Butterfly",
    artist: "Kendrick Lamar",
    x: -0.22,
    y: 0.22,
    z: 0.31,
    size: 0.056,
    color: "#ffb14a",
  },
  {
    id: "mbv-loveless",
    title: "Loveless",
    artist: "My Bloody Valentine",
    x: -0.5,
    y: 0.1,
    z: 0.02,
    size: 0.05,
    color: "#cc8cff",
  },
  {
    id: "bach-art-of-fugue",
    title: "The Art of Fugue",
    artist: "Bach",
    x: 0.08,
    y: 0.4,
    z: -0.52,
    size: 0.06,
    color: "#f2eee8",
  },
];

function clampWorks(works) {
  return works.map((w) => ({
    ...w,
    x: Math.max(-0.82, Math.min(0.82, w.x ?? 0)),
    y: Math.max(-0.82, Math.min(0.82, w.y ?? 0)),
    z: Math.max(-0.82, Math.min(0.82, w.z ?? 0)),
    size: Math.max(0.025, Math.min(0.07, w.size ?? 0.04)),
  }));
}

export default function GlobePage() {
  const [dark, setDark] = useState(true);

  const displayWorks = useMemo(() => clampWorks(demoWorks), []);

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
            Explore the map. Drag to spin. Wheel to zoom. The globe is now
            softer, zone-based, and theme-aware.
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
                style={{ background: "#65f0b5" }}
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
                style={{ background: "#ffb14a" }}
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
        </aside>
      </div>
    </main>
  );
}