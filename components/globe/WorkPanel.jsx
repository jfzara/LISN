"use client";

/**
 * WorkPanel v2 — adapté au format worksSeed OSR
 * Affiche : titre, artiste, entityType, biome, score (0-10), role
 * + barre de score visuelle + liens vers analyse complète
 */

const BIOME_LABEL = {
  dense:       "Dense",
  atmospheric: "Atmosphérique",
  structural:  "Structural",
  narrative:   "Narratif",
  hybrid:      "Hybride",
};

const BIOME_COLOR = {
  dense:       "#FF6B2F",
  atmospheric: "#4ABFFF",
  structural:  "#E8C97A",
  narrative:   "#FF9A4D",
  hybrid:      "#C07AE8",
};

const ROLE_LABEL = {
  capitale:  "Capitale",
  ville:     "Ville",
  pont:      "Pont",
  satellite: "Satellite",
  île:       "Île",
  village:   "Village",
};

const ENTITY_LABEL = {
  album:  "Album",
  track:  "Morceau",
  artist: "Artiste",
};

function ScoreBar({ score }) {
  // score sur 10 → barre
  const pct = Math.round((score / 10) * 100);
  const color = score >= 9.0 ? "#FF6B2F"
              : score >= 8.0 ? "#E8C97A"
              : score >= 7.0 ? "#4ABFFF"
              : "#888";
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.6 }}>
        <span>Score OSR</span>
        <span style={{ color, fontWeight: 600, fontSize: 12, opacity: 1 }}>{score.toFixed(1)}</span>
      </div>
      <div style={{ height: 2, background: "rgba(232,223,200,0.12)", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: color, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function MetaGrid({ work }) {
  const biome = work.biome || work.regime;
  const biomeColor = BIOME_COLOR[biome] || "#e8dfc8";
  const items = [
    { label: "Type",   value: ENTITY_LABEL[work.entityType] || work.entityType || "—" },
    { label: "Biome",  value: BIOME_LABEL[biome] || biome || "—", color: biomeColor },
    { label: "Rôle",   value: ROLE_LABEL[work.role] || work.role || "—" },
    { label: "Année",  value: work.year || "—" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 20 }}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ padding: "10px 10px", border: "1px solid rgba(232,223,200,0.10)", borderRadius: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.52, marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: color || "#e8dfc8" }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

export default function WorkPanel({ work, onClose }) {
  const isOpen = Boolean(work);

  return (
    <aside style={{
      position: "fixed",
      top: 18, right: 18, bottom: 18,
      width: "min(340px, calc(100vw - 36px))",
      zIndex: 40,
      background: "rgba(8,6,4,0.94)",
      border: "1px solid rgba(232,223,200,0.13)",
      backdropFilter: "blur(16px)",
      transform: isOpen ? "translateX(0)" : "translateX(calc(100% + 24px))",
      transition: "transform 240ms cubic-bezier(0.22,1,0.36,1)",
      color: "#e8dfc8",
      overflow: "hidden",
      fontFamily: "'Libre Baskerville', Georgia, serif",
      borderRadius: 1,
    }}>
      {work ? (
        <>
          {/* Bande de couleur biome en haut */}
          <div style={{
            height: 3,
            background: BIOME_COLOR[work.biome || work.regime] || "#666",
          }} />

          {/* Header */}
          <div style={{ padding: "18px 18px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.55 }}>
                {BIOME_LABEL[work.biome || work.regime] || "Œuvre"}
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "none", border: "1px solid rgba(232,223,200,0.18)",
                  color: "#e8dfc8", fontSize: 10, letterSpacing: "0.14em",
                  padding: "4px 8px", cursor: "pointer", borderRadius: 1,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                FERMER
              </button>
            </div>

            <h2 style={{ margin: "10px 0 0", fontSize: 26, lineHeight: 1.08, letterSpacing: "-0.02em", fontStyle: "italic" }}>
              {work.title}
            </h2>
            <div style={{ marginTop: 8, fontSize: 15, opacity: 0.78 }}>
              {work.artist}
            </div>
          </div>

          {/* Corps */}
          <div style={{ padding: "0 18px 24px", overflowY: "auto", maxHeight: "calc(100% - 120px)" }}>
            {/* Score */}
            {typeof work.score === "number" && (
              <ScoreBar score={work.score} />
            )}

            {/* Méta-données */}
            <MetaGrid work={work} />

            {/* Invitation à analyser */}
            <div style={{ marginTop: 22, padding: "14px", border: "1px solid rgba(232,223,200,0.10)", borderRadius: 1 }}>
              <div style={{ fontSize: 11, opacity: 0.55, letterSpacing: "0.10em", marginBottom: 8, textTransform: "uppercase" }}>
                Analyse structurale
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.65, opacity: 0.72 }}>
                Lancez une analyse LISN complète pour obtenir le diagnostic OSR, les scores dimensionnels et le verdict éditorial.
              </div>
              <button
                style={{
                  marginTop: 12, width: "100%", padding: "10px",
                  background: "none", border: "1px solid rgba(232,223,200,0.22)",
                  color: "#e8dfc8", fontSize: 10, letterSpacing: "0.18em",
                  textTransform: "uppercase", cursor: "pointer", borderRadius: 1,
                  fontFamily: "'DM Mono', monospace",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
                onClick={() => {
                  // Navigation vers la page d'analyse principale avec la query pré-remplie
                  const q = `${work.artist} -- ${work.title}`;
                  window.location.href = `/?q=${encodeURIComponent(q)}&type=${work.entityType || "album"}`;
                }}
              >
                <span style={{ color: BIOME_COLOR[work.biome || work.regime] || "#e8dfc8", fontSize: 14 }}>→</span>
                Analyser dans LISN
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: "32px 20px" }}>
          <div style={{ fontSize: 16, opacity: 0.72, lineHeight: 1.6 }}>
            Survolez une présence lumineuse,<br />cliquez pour ouvrir sa fiche.
          </div>
        </div>
      )}
    </aside>
  );
}
