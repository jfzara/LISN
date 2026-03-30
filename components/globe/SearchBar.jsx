"use client";

/**
 * SearchBar — "Autour de…"
 * Input minimal : artiste ou titre → trouve l'œuvre dans worksSeed
 * → sélectionne et centre la caméra dessus
 */

import { useState, useRef, useMemo, useEffect } from "react";
import { worksSeed } from "@/data/worksSeed";

function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function SearchBar({ dark, onSelect, T }) {
  const [query,   setQuery]   = useState("");
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef();

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return worksSeed
      .filter(w =>
        normalize(w.title).includes(q) ||
        normalize(w.artist).includes(q)
      )
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 8);
  }, [query]);

  useEffect(() => {
    setOpen(results.length > 0 && focused);
  }, [results, focused]);

  const BIOME_COLOR = {
    dense: "#FF6B2F", atmospheric: "#4ABFFF", structural: "#E8C97A",
    narrative: "#FF9A4D", hybrid: "#C07AE8",
  };

  const bord  = T.border;
  const cardBg = T.cardBg;

  function pick(work) {
    onSelect(work);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {/* Input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        border: `1px solid ${focused ? T.text : bord}`,
        borderRadius: 1, padding: "5px 8px",
        background: focused ? T.pill : "transparent",
        transition: "border-color 0.15s, background 0.15s",
      }}>
        <span style={{ fontSize: 10, color: T.muted, flexShrink: 0 }}>◎</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Artiste ou titre…"
          style={{
            background: "none", border: "none", outline: "none",
            fontSize: 10, color: T.text, width: 120,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.06em",
          }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} style={{
            background: "none", border: "none", cursor: "pointer",
            color: T.muted, fontSize: 12, padding: 0, flexShrink: 0,
          }}>×</button>
        )}
      </div>

      {/* Résultats */}
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: 0,
          width: 260, background: cardBg, border: `1px solid ${bord}`,
          borderRadius: 1, backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          zIndex: 50, overflow: "hidden",
        }}>
          {results.map(w => (
            <button key={w.id} onMouseDown={() => pick(w)} style={{
              width: "100%", padding: "9px 12px",
              background: "none", border: "none", borderBottom: `1px solid ${bord}`,
              cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", gap: 8,
              transition: "background 0.1s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = T.pill}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <span style={{
                width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                background: BIOME_COLOR[w.biome] || "#888",
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, color: T.text, fontStyle: "italic",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{w.title}</div>
                <div style={{
                  fontSize: 10, color: T.muted,
                  fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em",
                  marginTop: 1,
                }}>{w.artist}</div>
              </div>
              <span style={{
                fontSize: 10, color: T.muted,
                fontFamily: "'DM Mono', monospace", flexShrink: 0,
              }}>{Number(w.score || 0).toFixed(1)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
