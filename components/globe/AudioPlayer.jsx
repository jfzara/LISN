"use client";

/**
 * AudioPlayer v2 — Spotify Embed iframe
 *
 * Les preview_url directes sont mortes depuis nov 2023.
 * Solution : embed Spotify iframe — joue 30s automatiquement,
 * fonctionne sans auth utilisateur, supporte dark mode.
 *
 * https://developer.spotify.com/documentation/embeds
 */

import { useState, useCallback } from "react";

const BIOME_COLOR = {
  dense:"#FF6B2F", atmospheric:"#4ABFFF", structural:"#E8C97A",
  narrative:"#FF9A4D", hybrid:"#C07AE8",
};

export default function AudioPlayer({ work, dark }) {
  const [state,      setState]      = useState("idle"); // idle | loading | ready | error
  const [spotifyId,  setSpotifyId]  = useState(null);
  const [albumArt,   setAlbumArt]   = useState(null);
  const [trackInfo,  setTrackInfo]  = useState(null);
  const [showEmbed,  setShowEmbed]  = useState(false);

  const text    = dark ? "#e8dfc8"                : "#1a1410";
  const muted   = dark ? "rgba(232,223,200,0.42)" : "rgba(26,20,16,0.42)";
  const border  = dark ? "rgba(232,223,200,0.10)" : "rgba(26,20,16,0.12)";
  const trackBg = dark ? "rgba(232,223,200,0.07)" : "rgba(26,20,16,0.07)";
  const accentColor = BIOME_COLOR[work?.biome || work?.regime] || text;

  const load = useCallback(async () => {
    if (!work || state === "loading") return;
    setState("loading");

    try {
      const res  = await fetch(
        `/api/spotify-preview?artist=${encodeURIComponent(work.artist)}&title=${encodeURIComponent(work.title)}`
      );
      const data = await res.json();

      if (!data.spotifyId) {
        setState("error");
        return;
      }

      setSpotifyId(data.spotifyId);
      setAlbumArt(data.albumArt || null);
      setTrackInfo({ name: data.trackName, artist: data.artistName });
      setState("ready");
      setShowEmbed(true);
    } catch {
      setState("error");
    }
  }, [work, state]);

  function handlePlay() {
    if (state === "idle") { load(); return; }
    if (state === "ready") setShowEmbed(v => !v);
  }

  const embedUrl = spotifyId
    ? `https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=${dark ? 0 : 1}`
    : null;

  return (
    <div style={{ marginTop:14 }}>

      {/* Bouton déclencheur */}
      <div style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"9px 12px",
        border:`1px solid ${state === "ready" ? accentColor : border}`,
        borderRadius:1, cursor:"pointer",
        background: state === "ready" ? `${accentColor}12` : "none",
        transition:"all 0.15s",
      }} onClick={handlePlay}>

        {/* Pochette ou icône */}
        {albumArt ? (
          <img src={albumArt} alt="" style={{
            width:30, height:30, borderRadius:1,
            objectFit:"cover", flexShrink:0,
          }} />
        ) : (
          <div style={{
            width:30, height:30, borderRadius:1, flexShrink:0,
            background: trackBg,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <span style={{ fontSize:12, color: muted }}>♫</span>
          </div>
        )}

        {/* Texte */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:10, color: text, overflow:"hidden",
            textOverflow:"ellipsis", whiteSpace:"nowrap", fontStyle:"italic" }}>
            {trackInfo?.name || work?.title}
          </div>
          <div style={{ fontSize:9, color: muted, marginTop:1,
            fontFamily:"'DM Mono',monospace", letterSpacing:"0.06em" }}>
            {state === "loading" ? "Recherche sur Spotify…"
              : state === "error"   ? "Non trouvé sur Spotify"
              : state === "ready"   ? (showEmbed ? "▾ Réduire" : "▸ Écouter")
              : "▸ Écouter sur Spotify"}
          </div>
        </div>

        {/* Indicateur état */}
        <div style={{
          width:7, height:7, borderRadius:"50%", flexShrink:0,
          background: state === "ready"   ? accentColor
                    : state === "loading" ? "#888"
                    : state === "error"   ? "#cc4444"
                    : border,
          opacity: state === "idle" ? 0.4 : 1,
          transition:"background 0.2s",
        }} />
      </div>

      {/* Embed Spotify — iframe officiel */}
      {showEmbed && embedUrl && (
        <div style={{ marginTop:6, borderRadius:1, overflow:"hidden" }}>
          <iframe
            src={embedUrl}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ display:"block", borderRadius:1 }}
          />
        </div>
      )}
    </div>
  );
}
