"use client";

/**
 * AudioPlayer — barre de lecture Spotify 30s
 * Apparaît en bas du WorkPanel quand une preview est disponible.
 * Design sobre, éditorial — pas de gros boutons.
 */

import { useSpotifyPreview } from "@/hooks/useSpotifyPreview";

export default function AudioPlayer({ work, dark }) {
  const { workId, isPlaying, isLoading, progress, error, albumArt, play, stop, seek } =
    useSpotifyPreview();

  const isCurrentWork = workId === work?.id;
  const text   = dark ? "#e8dfc8"                : "#1a1410";
  const muted  = dark ? "rgba(232,223,200,0.42)" : "rgba(26,20,16,0.42)";
  const border = dark ? "rgba(232,223,200,0.10)" : "rgba(26,20,16,0.12)";
  const trackBg= dark ? "rgba(232,223,200,0.08)" : "rgba(26,20,16,0.08)";
  const accent = dark ? "#e8dfc8"                : "#1a1410";

  const BIOME_COLOR = {
    dense:"#FF6B2F", atmospheric:"#4ABFFF", structural:"#E8C97A",
    narrative:"#FF9A4D", hybrid:"#C07AE8",
  };
  const accentColor = BIOME_COLOR[work?.biome || work?.regime] || accent;

  function handlePlayPause() {
    if (!work) return;
    play(work);
  }

  function handleSeek(e) {
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(Math.max(0, Math.min(1, ratio)));
  }

  const pct = Math.round((isCurrentWork ? progress : 0) * 100);

  return (
    <div style={{
      marginTop: 14,
      padding: "10px 12px",
      border: `1px solid ${border}`,
      borderRadius: 1,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>

        {/* Album art */}
        {isCurrentWork && albumArt ? (
          <img src={albumArt} alt="" style={{
            width:32, height:32, borderRadius:1, objectFit:"cover", flexShrink:0,
            opacity: 0.85,
          }} />
        ) : (
          <div style={{
            width:32, height:32, borderRadius:1, flexShrink:0,
            background: trackBg,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <span style={{ fontSize:12, opacity:0.3 }}>♪</span>
          </div>
        )}

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:10, color: text, overflow:"hidden",
            textOverflow:"ellipsis", whiteSpace:"nowrap", fontStyle:"italic" }}>
            {work?.title}
          </div>
          <div style={{ fontSize:9, color: muted, marginTop:1,
            fontFamily:"'DM Mono',monospace", letterSpacing:"0.06em" }}>
            {isLoading && isCurrentWork ? "Chargement…"
              : error && isCurrentWork ? "Preview indisponible"
              : "Spotify · 30s preview"}
          </div>
        </div>

        {/* Bouton play/pause */}
        <button
          onClick={handlePlayPause}
          disabled={isLoading && isCurrentWork}
          style={{
            width:28, height:28, borderRadius:"50%",
            border:`1px solid ${isCurrentWork && isPlaying ? accentColor : border}`,
            background: isCurrentWork && isPlaying ? accentColor : "none",
            color: isCurrentWork && isPlaying ? (dark ? "#080604" : "#ffffff") : text,
            cursor: "pointer", flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:10, transition:"all 0.15s",
            opacity: (isLoading && isCurrentWork) ? 0.5 : 1,
          }}
        >
          {isLoading && isCurrentWork ? (
            <span style={{ fontSize:8, opacity:0.6 }}>…</span>
          ) : isCurrentWork && isPlaying ? (
            <span>◼</span>
          ) : (
            <span>▷</span>
          )}
        </button>
      </div>

      {/* Barre de progression — cliquable */}
      {isCurrentWork && !error && (
        <div
          onClick={handleSeek}
          style={{
            height:2, background: trackBg, cursor:"pointer",
            position:"relative", borderRadius:1,
          }}
        >
          <div style={{
            position:"absolute", left:0, top:0, height:"100%",
            width:`${pct}%`, background: accentColor,
            transition:"width 0.2s linear", borderRadius:1,
          }} />
        </div>
      )}

      {/* Erreur */}
      {isCurrentWork && error && (
        <div style={{ fontSize:9, color: muted, fontFamily:"'DM Mono',monospace",
          letterSpacing:"0.08em" }}>
          {error}
        </div>
      )}
    </div>
  );
}
