"use client";

/**
 * ComparePanel — comparer deux œuvres structuralement
 * Affiche : distance sur le globe, différences dimensionnelles, verdict textuel
 */

const BIOME_COLOR = {
  dense: "#FF6B2F", atmospheric: "#4ABFFF", structural: "#E8C97A",
  narrative: "#FF9A4D", hybrid: "#C07AE8",
};
const BIOME_LABEL = {
  dense: "Dense", atmospheric: "Atmosphérique", structural: "Structural",
  narrative: "Narratif", hybrid: "Hybride",
};

// Distance structurale approximative entre deux œuvres du seed
function computeDistance(a, b) {
  if (!a || !b) return null;
  const dphi   = Math.abs((a.phi || 0) - (b.phi || 0));
  const dtheta = Math.abs((a.theta || 0) - (b.theta || 0));
  const ang    = Math.sqrt(dphi * dphi + dtheta * dtheta);
  const dscore = Math.abs((a.score || 0) - (b.score || 0)) / 5;
  const dbiome = a.biome !== b.biome ? 0.3 : 0;
  return Math.min(1, 0.5 * ang + 0.3 * dscore + 0.2 * dbiome);
}

function distanceLabel(d) {
  if (d === null) return "—";
  if (d < 0.10) return "Très proches";
  if (d < 0.22) return "Proches";
  if (d < 0.40) return "Éloignées";
  if (d < 0.60) return "Très éloignées";
  return "Mondes opposés";
}

function scoreVerdict(a, b) {
  if (!a || !b) return null;
  const diff = (a.score || 0) - (b.score || 0);
  const nameA = a.title, nameB = b.title;
  if (Math.abs(diff) < 0.3) return `${nameA} et ${nameB} sont structuralement équivalentes.`;
  const higher = diff > 0 ? nameA : nameB;
  const lower  = diff > 0 ? nameB : nameA;
  const gap    = Math.abs(diff).toFixed(1);
  if (Math.abs(diff) < 1.0) return `${higher} dépasse légèrement ${lower} (+${gap}).`;
  if (Math.abs(diff) < 2.5) return `${higher} est structuralement supérieure à ${lower} (+${gap}).`;
  return `${higher} appartient à un autre ordre de grandeur que ${lower} (+${gap}).`;
}

function WorkSlot({ work, label, dark, T, onClear }) {
  const text  = T.text;
  const muted = T.muted;
  const bord  = T.border;
  const biome = work?.biome || work?.regime;
  const col   = BIOME_COLOR[biome];

  return (
    <div style={{
      flex: 1, minWidth: 0, padding: "12px",
      border: `1px solid ${col || bord}`, borderRadius: 1,
      position: "relative",
    }}>
      <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
        color: muted, fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>
        {label}
      </div>
      {work ? (
        <>
          {onClear && (
            <button onClick={onClear} style={{
              position: "absolute", top: 8, right: 8,
              background: "none", border: "none", cursor: "pointer",
              color: muted, fontSize: 11, padding: 0,
            }}>×</button>
          )}
          {col && <span style={{ display: "inline-block", width: 6, height: 6,
            borderRadius: "50%", background: col, marginBottom: 4 }} />}
          <div style={{ fontSize: 13, fontStyle: "italic", color: text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {work.title}
          </div>
          <div style={{ fontSize: 10, color: muted, marginTop: 3,
            fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em" }}>
            {work.artist}
          </div>
          <div style={{ fontSize: 18, fontFamily: "'DM Mono',monospace",
            color: col || text, marginTop: 8, letterSpacing: "-0.02em" }}>
            {Number(work.score || 0).toFixed(1)}
          </div>
          <div style={{ fontSize: 9, color: muted, textTransform: "uppercase",
            letterSpacing: "0.12em", fontFamily: "'DM Mono',monospace" }}>
            {BIOME_LABEL[biome] || biome || "—"}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 11, color: muted, lineHeight: 1.6 }}>
          Sélectionnez une œuvre sur le globe
        </div>
      )}
    </div>
  );
}

export default function ComparePanel({ workA, workB, onClearA, onClearB, dark, T }) {
  const bord  = T.border;
  const muted = T.muted;
  const text  = T.text;

  const dist  = computeDistance(workA, workB);
  const label = distanceLabel(dist);
  const verdict = scoreVerdict(workA, workB);

  // Barre de distance
  const distPct = dist !== null ? Math.round(dist * 100) : null;
  const distColor = dist === null ? bord
    : dist < 0.2 ? "#4ABFFF" : dist < 0.45 ? "#E8C97A" : "#FF6B2F";

  return (
    <div style={{
      position: "fixed", bottom: 68, left: "50%", transform: "translateX(-50%)",
      width: "min(540px, calc(100vw - 32px))",
      background: T.cardBg, border: `1px solid ${bord}`,
      borderRadius: 1, backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      zIndex: 30, padding: "14px",
      fontFamily: "'Libre Baskerville', Georgia, serif",
    }}>

      {/* Header */}
      <div style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase",
        color: muted, fontFamily: "'DM Mono',monospace", marginBottom: 12 }}>
        Comparaison structurale
      </div>

      {/* Deux slots */}
      <div style={{ display: "flex", gap: 10 }}>
        <WorkSlot work={workA} label="A" dark={dark} T={T} onClear={onClearA} />
        <WorkSlot work={workB} label="B" dark={dark} T={T} onClear={onClearB} />
      </div>

      {/* Distance */}
      {workA && workB && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            fontSize: 9, color: muted, fontFamily: "'DM Mono',monospace",
            letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 }}>
            <span>Distance structurale</span>
            <span style={{ color: distColor }}>{label}</span>
          </div>
          <div style={{ height: 1, background: T.track, position: "relative" }}>
            <div style={{
              position: "absolute", left: 0, top: 0, height: "100%",
              width: `${distPct}%`, background: distColor,
              transition: "width 0.5s ease",
            }} />
          </div>

          {/* Verdict */}
          {verdict && (
            <div style={{ marginTop: 12, fontSize: 12, color: text,
              lineHeight: 1.65, fontStyle: "italic", borderLeft: `2px solid ${bord}`,
              paddingLeft: 10 }}>
              {verdict}
            </div>
          )}

          {/* Biomes différents */}
          {workA.biome !== workB.biome && (
            <div style={{ marginTop: 8, fontSize: 10, color: muted,
              fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em" }}>
              Biomes distincts — {BIOME_LABEL[workA.biome]} vs {BIOME_LABEL[workB.biome]}
            </div>
          )}
        </div>
      )}

      {/* Instruction si vide */}
      {(!workA || !workB) && (
        <div style={{ marginTop: 12, fontSize: 10, color: muted,
          fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em", lineHeight: 1.6 }}>
          {!workA && !workB
            ? "Cliquez deux œuvres sur le globe pour les comparer."
            : "Cliquez une deuxième œuvre pour comparer."}
        </div>
      )}
    </div>
  );
}
