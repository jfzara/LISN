"use client";

import { worksSeed } from "@/data/worksSeed";

// Index signature track par artiste — l'œuvre au score le plus élevé
function buildSignatureIndex() {
  const byArtist = {};
  worksSeed.forEach(w => {
    const cur = byArtist[w.artist];
    if (!cur || w.score > cur.score) byArtist[w.artist] = w;
  });
  return byArtist;
}
const SIGNATURE = buildSignatureIndex();

/**
 * AudioPlayer v3 — YouTube Embed
 * YouTube Data API v3 — gratuit, sans compte requis
 * Embed iframe YouTube — lecture complète, pas de restriction
 */

import { useState, useCallback } from "react";

const BIOME_COLOR = {
  dense:"#FF6B2F", atmospheric:"#4ABFFF", structural:"#E8C97A",
  narrative:"#FF9A4D", hybrid:"#C07AE8",
};

export default function AudioPlayer({ work, dark }) {
  const [state,      setState]      = useState("idle");
  const [videoId,       setVideoId]       = useState(null);
  const [thumbnail,     setThumbnail]     = useState(null);
  const [videoTitle,    setVideoTitle]    = useState(null);
  const [signatureTitle,setSignatureTitle]= useState(null);
  const [errorMsg,      setErrorMsg]      = useState(null);
  const [showEmbed,     setShowEmbed]     = useState(false);

  const text      = dark ? "#f2ead8"                : "#120e0a";
  const muted     = dark ? "#9c8e7e"                : "#5c5048";
  const border    = dark ? "rgba(242,234,216,0.12)" : "rgba(18,14,10,0.14)";
  const trackBg   = dark ? "rgba(242,234,216,0.07)" : "rgba(18,14,10,0.07)";
  const accentCol = BIOME_COLOR[work?.biome || work?.regime] || (dark ? "#f2ead8" : "#120e0a");

  const load = useCallback(async () => {
    if (!work || state === "loading") return;
    setState("loading");
    setErrorMsg(null);

    try {
      // Pour un artiste sans titre — trouver sa signature track
      let searchTitle = work.title;
      if (!searchTitle || work.entityType === "artist") {
        const sig = SIGNATURE[work.artist];
        searchTitle = sig?.title || work.artist; // fallback : juste le nom
      }

      const res  = await fetch(
        `/api/youtube-preview?artist=${encodeURIComponent(work.artist)}&title=${encodeURIComponent(searchTitle)}`
      );
      const data = await res.json();

      if (!data.videoId) {
        setErrorMsg(data.error || data.debug || "Non trouvé sur YouTube");
        setState("error");
        return;
      }

      setVideoId(data.videoId);
      setThumbnail(data.thumbnail || null);
      setVideoTitle(data.videoTitle || null);
      // Si artiste — indiquer quelle signature track joue
      if (work.entityType === "artist" && searchTitle !== work.artist) {
        setSignatureTitle(searchTitle);
      }
      setState("ready");
      setShowEmbed(true);
    } catch (err) {
      setErrorMsg(err.message || "Erreur réseau");
      setState("error");
    }
  }, [work, state]);

  function handleClick() {
    if (state === "idle")  { load(); return; }
    if (state === "error") { setState("idle"); load(); return; } // retry
    if (state === "ready") { setShowEmbed(v => !v); }
  }

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    : null;

  return (
    <div style={{ marginTop: 14 }}>

      {/* Déclencheur */}
      <div
        onClick={handleClick}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 12px",
          border: `1px solid ${state === "ready" ? accentCol : border}`,
          borderRadius: 1, cursor: "pointer",
          background: state === "ready" ? `${accentCol}14` : "none",
          transition: "all 0.15s",
        }}
      >
        {/* Thumbnail ou icône */}
        {thumbnail && state === "ready" ? (
          <img
            src={thumbnail}
            alt=""
            style={{
              width: 36, height: 27, objectFit: "cover",
              borderRadius: 1, flexShrink: 0,
            }}
          />
        ) : (
          <div style={{
            width: 36, height: 27, borderRadius: 1, flexShrink: 0,
            background: trackBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {/* Logo YouTube simplifié */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect width="16" height="12" rx="2" fill={state === "error" ? "#cc4444" : border} />
              <polygon points="6,3 6,9 11,6" fill={text} opacity="0.7" />
            </svg>
          </div>
        )}

        {/* Texte */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10, color: text, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic",
          }}>
            {state === "ready" && videoTitle ? videoTitle : work?.title}
          </div>
          <div style={{
            fontSize: 9, color: muted, marginTop: 1,
            fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em",
          }}>
            {state === "loading"
            ? "Recherche sur YouTube…"
            : state === "error"
            ? (errorMsg || "Non trouvé")
            : state === "ready"
            ? (showEmbed
                ? "▾ Réduire"
                : signatureTitle
                  ? `▸ ${signatureTitle}`
                  : "▸ Écouter")
            : signatureTitle
              ? `▸ ${signatureTitle}`
              : "▸ Écouter sur YouTube"}
          </div>
        </div>

        {/* Indicateur */}
        <div style={{
          width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
          background: state === "ready"   ? accentCol
                    : state === "loading" ? "#888888"
                    : state === "error"   ? "#cc4444"
                    : border,
          opacity: state === "idle" ? 0.4 : 1,
          transition: "background 0.2s",
          animation: state === "loading" ? "pulse 1s infinite" : "none",
        }} />
      </div>

      {/* Embed YouTube */}
      {showEmbed && embedUrl && (
        <div style={{
          marginTop: 6,
          borderRadius: 1,
          overflow: "hidden",
          border: `1px solid ${border}`,
          background: "#000",
          aspectRatio: "16/9",
          position: "relative",
        }}>
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{
              display: "block",
              position: "absolute", inset: 0,
              border: "none",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
