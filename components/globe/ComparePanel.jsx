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
  fr: { dense:"Dense", atmospheric:"Atmosphérique", structural:"Structurel", narrative:"Narratif", hybrid:"Hybride" },
  en: { dense:"Dense", atmospheric:"Atmospheric",   structural:"Structural", narrative:"Narrative", hybrid:"Hybrid"  },
};
const COMPARE_UI = {
  fr: { title:C.title, distLabel:C.distLabel,
        instruction1:C.instruction1,
        instruction2:C.instruction2,
        levels:{ veryClose:"Très proches", close:"Proches", far:"Éloignées", veryFar:"Très éloignées", opposite:"Mondes opposés" },
        biomesDiff: (a,b) => `Zones distinctes — ${a} et ${b}` },
  en: { title:"Structural comparison", distLabel:"Structural distance",
        instruction1:"Click two works on the globe to compare.",
        instruction2:"Click a second work to compare.",
        levels:{ veryClose:"Very close", close:"Close", far:"Distant", veryFar:"Very distant", opposite:"Opposite worlds" },
        biomesDiff: (a,b) => `Different zones — ${a} and ${b}` },
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

function distanceLabel(d, lang = "fr") {
  const L = (COMPARE_UI[lang] || COMPARE_UI.fr).levels;
  if (d === null) return "—";
  if (d < 0.10) return L.veryClose;
  if (d < 0.22) return L.close;
  if (d < 0.40) return L.far;
  if (d < 0.60) return L.veryFar;
  return L.opposite;
}

function scoreVerdict(a, b, lang = "fr") {
  if (!a || !b) return null;
  const diff = (a.score || 0) - (b.score || 0);
  const nameA = a.title, nameB = b.title;
  const higher = diff > 0 ? nameA : nameB;
  const lower  = diff > 0 ? nameB : nameA;
  const gap    = Math.abs(diff).toFixed(1);
  if (lang === "en") {
    if (Math.abs(diff) < 0.3) return `${nameA} and ${nameB} are structurally equivalent.`;
    if (Math.abs(diff) < 1.0) return `${higher} slightly outranks ${lower} (+${gap}).`;
    if (Math.abs(diff) < 2.5) return `${higher} is structurally stronger than ${lower} (+${gap}).`;
    return `${higher} belongs to a different order of magnitude than ${lower} (+${gap}).`;
  }
  if (Math.abs(diff) < 0.3) return `${nameA} et ${nameB} sont structurellement équivalentes.`;
  if (Math.abs(diff) < 1.0) return `${higher} dépasse légèrement ${lower} (+${gap}).`;
  if (Math.abs(diff) < 2.5) return `${higher} est structurellement supérieure à ${lower} (+${gap}).`;
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
      <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
        color: muted, fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>
        {label}
      </div>
      {work ? (
        <>
          {onClear && (
            <button onClick={onClear} style={{
              position: "absolute", top: 8, right: 8,
              background: "none", border: "none", cursor: "pointer",
              color: muted, fontSize: 12, padding: 0,
            }}>×</button>
          )}
          {col && <span style={{ display: "inline-block", width: 6, height: 6,
            borderRadius: "50%", background: col, marginBottom: 4 }} />}
          <div style={{ fontSize: 14, fontStyle: "italic", color: text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {work.title}
          </div>
          <div style={{ fontSize: 12, color: muted, marginTop: 3,
            fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em" }}>
            {work.artist}
          </div>
          <div style={{ fontSize: 18, fontFamily: "'DM Mono',monospace",
            color: col || text, marginTop: 8, letterSpacing: "-0.02em" }}>
            {Number(work.score || 0).toFixed(1)}
          </div>
          <div style={{ fontSize: 11, color: muted, textTransform: "uppercase",
            letterSpacing: "0.12em", fontFamily: "'DM Mono',monospace" }}>
            {BL[biome] || biome || "—"}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: muted, lineHeight: 1.6 }}>
          Sélectionnez une œuvre sur le globe
        </div>
      )}
    </div>
  );
}

export default function ComparePanel({ workA, workB, onClearA, onClearB, dark, T, lang = "fr" }) {
  const C  = COMPARE_UI[lang] || COMPARE_UI.fr;
  const BL = BIOME_LABEL[lang] || BIOME_LABEL.fr;
  const bord  = T.border;
  const muted = T.muted;
  const text  = T.text;

  const dist  = computeDistance(workA, workB);
  const label = distanceLabel(dist, lang);
  const verdict = scoreVerdict(workA, workB, lang);

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
      <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
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
            fontSize: 11, color: muted, fontFamily: "'DM Mono',monospace",
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
            <div style={{ marginTop: 12, fontSize: 13, color: text,
              lineHeight: 1.65, fontStyle: "italic", borderLeft: `2px solid ${bord}`,
              paddingLeft: 10 }}>
              {verdict}
            </div>
          )}

          {/* Biomes différents */}
          {workA.biome !== workB.biome && (
            <div style={{ marginTop: 8, fontSize: 12, color: muted,
              fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em" }}>
              Biomes distincts — {BIOME_LABEL[workA.biome]} vs {BIOME_LABEL[workB.biome]}
            </div>
          )}
        </div>
      )}

      {/* Instruction si vide */}
      {(!workA || !workB) && (
        <div style={{ marginTop: 12, fontSize: 12, color: muted,
          fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em", lineHeight: 1.6 }}>
          {!workA && !workB
            ? C.instruction1
            : C.instruction2}
        </div>
      )}
    </div>
  );
}
