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

export default function SearchBar({ dark, onSelect, T, lang = "fr" }) {
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
    dense: "#8c8c8c", atmospheric: "#8c8c8c", structural: "#8c8c8c",
    narrative: "#8c8c8c", hybrid: "#8c8c8c",
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
        border: "none", boxShadow: focused ? `inset 0 -2px 0 ${T.text}` : "none",
        borderRadius:0, padding: "5px 8px",
        background: T.pill,
        transition: "border-color 0.15s, background 0.15s",
      }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={lang === "fr" ? "Artiste ou titre…" : "Artist or title…"}
          style={{
            background: "none", border: "none", outline: "none",
            fontSize:11, color: T.text, width: 120,
            fontFamily: "var(--font-ui)",
            letterSpacing:"0.005em",
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
          width: 260, background: cardBg, border: "none", boxShadow: "0 24px 50px -10px rgba(0,0,0,0.5)",
          borderRadius:0, backdropFilter:"none",
          WebkitBackdropFilter:"none",
          zIndex: 50, overflow: "hidden",
        }}>
          {results.map(w => (
            <button key={w.id} onMouseDown={() => pick(w)} style={{
              width: "100%", padding: "9px 12px",
              background: "none", border: "none", borderBottom: `2px dotted ${bord}`,
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
                  fontSize: 12, color: T.text, fontStyle:"normal",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{w.title}</div>
                <div style={{
                  fontSize:11, color: T.muted,
                  fontFamily: "var(--font-ui)", letterSpacing:"0.005em",
                  marginTop: 1,
                }}>{w.artist}</div>
              </div>
              
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
