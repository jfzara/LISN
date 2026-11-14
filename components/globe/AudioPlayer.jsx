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
  dense:"#8c8c8c", atmospheric:"#8c8c8c", structural:"#8c8c8c",
  narrative:"#8c8c8c", hybrid:"#8c8c8c",
};

export default function AudioPlayer({ work, dark, lang = "fr" }) {
  const [state,      setState]      = useState("idle");
  const [videoId,       setVideoId]       = useState(null);
  const [thumbnail,     setThumbnail]     = useState(null);
  const [videoTitle,    setVideoTitle]    = useState(null);
  const [channelTitle,  setChannelTitle]  = useState(null);
  const [signatureTitle,setSignatureTitle]= useState(null);
  const [errorMsg,      setErrorMsg]      = useState(null);
  const [showEmbed,     setShowEmbed]     = useState(false);

  const text      = dark ? "#ffffff"                : "#000000";
  const muted     = dark ? "rgba(255,255,255,0.62)"                : "rgba(0,0,0,0.58)";
  const border    = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.14)";
  const trackBg   = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const accentCol = BIOME_COLOR[work?.biome || work?.regime] || (dark ? "#ffffff" : "#000000");

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
        setErrorMsg(data.error || "not_found");
        setState("error");
        return;
      }

      setVideoId(data.videoId);
      setThumbnail(data.thumbnail || null);
      setVideoTitle(data.videoTitle || null);
      setChannelTitle(data.channelTitle || null);
      // Si artiste — indiquer quelle signature track joue
      if (work.entityType === "artist" && searchTitle !== work.artist) {
        setSignatureTitle(searchTitle);
      }
      setState("ready");
      setShowEmbed(true);
    } catch (err) {
      setErrorMsg("network");
      setState("error");
    }
  }, [work, state]);

  function handleClick() {
    if (state === "idle")  { load(); return; }
    // En cas d'échec, l'écoute reste possible : on ouvre la recherche YouTube
    if (state === "error") { window.open(searchUrl, "_blank", "noopener"); return; }
    if (state === "ready") { setShowEmbed(v => !v); }
  }

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${work?.artist || ""} ${work?.title || ""}`.trim())}`;
  const REASON = {
    fr: { no_key:"Clé YouTube absente du serveur", bad_key:"Clé YouTube refusée", quota:"Quota YouTube épuisé pour aujourd'hui",
          not_found:"Introuvable automatiquement", network:"Connexion impossible", search_failed:"Recherche en échec" },
    en: { no_key:"YouTube key missing on server", bad_key:"YouTube key rejected", quota:"YouTube quota used up for today",
          not_found:"Not found automatically", network:"Connection failed", search_failed:"Search failed" },
  }[lang === "fr" ? "fr" : "en"];

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
          border: "none",
          borderRadius:0, cursor: "pointer",
          background: dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)",
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
              borderRadius:0, flexShrink: 0,
            }}
          />
        ) : (
          <div style={{
            width: 36, height: 27, borderRadius:0, flexShrink: 0,
            background: trackBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {/* Logo YouTube simplifié */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect width="16" height="12" rx="2" fill={border} />
              <polygon points="6,3 6,9 11,6" fill={text} opacity="0.7" />
            </svg>
          </div>
        )}

        {/* Texte */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize:11, color: text, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle:"normal",
          }}>
            {state === "ready" && videoTitle ? videoTitle : work?.title}
          </div>
          <div style={{
            fontSize:11, color: muted, marginTop: 1,
            fontFamily: "var(--font-ui)", letterSpacing:"0.005em",
          }}>
            {state === "loading"
            ? lang === "fr" ? "Recherche sur YouTube…" : "Searching YouTube…"
            : state === "error"
            ? `${REASON[errorMsg] || REASON.search_failed} — ${lang === "fr" ? "ouvrir sur YouTube" : "open on YouTube"} ↗`
            : state === "ready"
            ? (showEmbed
                ? lang === "fr" ? "Réduire" : "Collapse"
                : signatureTitle
                  ? `${signatureTitle}`
                  : lang === "fr" ? "Écouter" : "Listen")
            : signatureTitle
              ? `${signatureTitle}`
              : lang === "fr" ? "Écouter sur YouTube" : "Listen on YouTube"}
          </div>
          {/* Chaîne source — aide à détecter réaction/cover */}
          {state === "ready" && channelTitle && (
            <div style={{
              fontSize:11, color: muted, marginTop: 1, opacity: 0.6,
              fontFamily: "var(--font-ui)", letterSpacing: "0.04em",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {channelTitle}
            </div>
          )}
        </div>

        {/* Indicateur */}
        <div style={{
          width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
          background: state === "ready"   ? accentCol
                    : state === "loading" ? "#888888"
                    : state === "error"   ? "#888888"
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
          borderRadius:0,
          overflow: "hidden",
          border: "none",
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
