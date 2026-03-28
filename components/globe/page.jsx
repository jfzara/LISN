"use client";

import { useMemo, useState } from "react";
import GlobeScene from "@/components/globe/GlobeScene";
import WorkPanel  from "@/components/globe/WorkPanel";
import { worksSeed } from "@/data/worksSeed";

const BIOME_META = {
  all:         { label: "Tout",          color: "#e8dfc8" },
  dense:       { label: "Dense",         color: "#FF6B2F" },
  atmospheric: { label: "Atmosphérique", color: "#4ABFFF" },
  structural:  { label: "Structural",    color: "#E8C97A" },
  narrative:   { label: "Narratif",      color: "#FF9A4D" },
  hybrid:      { label: "Hybride",       color: "#C07AE8" },
};

export default function GlobePage() {
  const [selectedWork, setSelectedWork] = useState(null);
  const [hoveredWork,  setHoveredWork]  = useState(null);
  const [biomeFilter,  setBiomeFilter]  = useState("all");

  const filteredWorks = useMemo(() =>
    biomeFilter === "all"
      ? worksSeed
      : worksSeed.filter(w => (w.biome || w.regime) === biomeFilter),
  [biomeFilter]);

  function handleSelect(work) {
    setSelectedWork(prev => prev?.id === work?.id ? null : work);
    setHoveredWork(null);
  }

  const activeMeta = BIOME_META[biomeFilter];

  return (
    <div style={S.page}>

      {/* Globe — fond de scène */}
      <div style={S.stage}>
        <GlobeScene
          works={filteredWorks}
          selectedWork={selectedWork}
          hoveredWork={hoveredWork}
          onSelectWork={handleSelect}
          onHoverWork={setHoveredWork}
          activeFilter={biomeFilter}
        />
      </div>

      {/* Filtres biome */}
      <nav style={S.nav}>
        {Object.entries(BIOME_META).map(([key, meta]) => (
          <button
            key={key}
            style={{
              ...S.btn,
              borderColor: biomeFilter === key ? meta.color : "rgba(232,223,200,0.18)",
              color:       biomeFilter === key ? meta.color : "rgba(232,223,200,0.55)",
            }}
            onClick={() => setBiomeFilter(key)}
          >
            {biomeFilter === key && <span style={{ ...S.dot, background: meta.color }} />}
            {meta.label}
          </button>
        ))}
      </nav>

      {/* Hover card */}
      {hoveredWork && !selectedWork && (
        <div style={S.hoverCard}>
          <span style={{
            ...S.hoverDot,
            background: BIOME_META[hoveredWork.biome || hoveredWork.regime]?.color || "#fff",
          }} />
          <div>
            <div style={S.hoverTitle}>{hoveredWork.title}</div>
            <div style={S.hoverArtist}>{hoveredWork.artist}</div>
          </div>
          {hoveredWork.score && (
            <span style={S.hoverScore}>{Number(hoveredWork.score).toFixed(1)}</span>
          )}
        </div>
      )}

      {/* Légende */}
      <div style={S.legend}>
        {Object.entries(BIOME_META).filter(([k]) => k !== "all").map(([key, meta]) => (
          <button key={key} style={S.legendItem} onClick={() => setBiomeFilter(key)}>
            <span style={{ ...S.legendDot, background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
            <span style={S.legendLabel}>{meta.label}</span>
          </button>
        ))}
      </div>

      {/* Wordmark */}
      <div style={S.wordmark}>
        <span style={S.wLisn}>lisn</span>
        <span style={S.wSub}>globe · {filteredWorks.length} œuvres</span>
      </div>

      {/* Panel sélection */}
      <WorkPanel work={selectedWork} onClose={() => setSelectedWork(null)} />
    </div>
  );
}

const S = {
  page:    { width:"100vw", height:"100vh", background:"#060504", color:"#e8dfc8", position:"relative", overflow:"hidden", fontFamily:"'Libre Baskerville',Georgia,serif" },
  stage:   { position:"absolute", inset:0 },
  nav: {
    position:"absolute", top:18, left:18, zIndex:20,
    display:"flex", gap:8, alignItems:"center",
  },
  btn: {
    background:"none", border:"1px solid", borderRadius:1,
    fontSize:10, letterSpacing:"0.15em", padding:"6px 10px",
    cursor:"pointer", display:"flex", alignItems:"center", gap:5,
    fontFamily:"'DM Mono','Courier New',monospace", textTransform:"uppercase",
    transition:"border-color 0.15s, color 0.15s",
  },
  dot:  { width:6, height:6, borderRadius:"50%", flexShrink:0 },
  hoverCard: {
    position:"absolute", bottom:36, left:"50%", transform:"translateX(-50%)",
    background:"rgba(6,5,4,0.90)", border:"1px solid rgba(232,223,200,0.14)",
    borderRadius:1, padding:"10px 14px", pointerEvents:"none",
    backdropFilter:"blur(12px)", display:"flex", alignItems:"center",
    gap:10, minWidth:200,
  },
  hoverDot:   { width:8, height:8, borderRadius:"50%", flexShrink:0 },
  hoverTitle: { fontSize:14, fontStyle:"italic", color:"#e8dfc8" },
  hoverArtist:{ fontSize:11, opacity:0.60, marginTop:2, fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em" },
  hoverScore: { marginLeft:"auto", fontSize:13, fontFamily:"'DM Mono',monospace", opacity:0.65, flexShrink:0 },
  legend: {
    position:"absolute", bottom:24, left:20, zIndex:10,
    display:"flex", flexDirection:"column", gap:6,
  },
  legendItem: {
    display:"flex", alignItems:"center", gap:8, cursor:"pointer",
    background:"none", border:"none", padding:0,
  },
  legendDot:   { width:7, height:7, borderRadius:"50%", flexShrink:0 },
  legendLabel: { fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace", color:"rgba(232,223,200,0.62)" },
  wordmark: { position:"absolute", top:18, right:20, zIndex:10, textAlign:"right" },
  wLisn:    { display:"block", fontSize:22, fontStyle:"italic", letterSpacing:"-0.04em", color:"#e8dfc8", lineHeight:1 },
  wSub:     { display:"block", fontSize:8, letterSpacing:"0.22em", color:"rgba(232,223,200,0.45)", fontFamily:"'DM Mono',monospace", marginTop:3 },
};
