import { BasisBadge, ConfidenceBadge } from "./Badges";

function sc(a, key) { return Number(a?.scores?.[key] || 0); }
function dim(code) {
  return { D: "Densité", G: "Grain", S: "Singularité", P: "Profondeur" }[code] || code;
}
function winner(a, b, key) {
  const diff = sc(a, key) - sc(b, key);
  if (Math.abs(diff) < 0.15) return "tie";
  return diff > 0 ? "a" : "b";
}
function resVal(a) {
  return { CONFIRMEE: 3, PARTIELLE: 2, NON_ETABLIE: 1 }[a?.resistance?.status] ?? 0;
}

function buildSummary(a, b) {
  const adv_a = [], adv_b = [];
  for (const k of ["D", "G", "S", "P"]) {
    const w = winner(a, b, k);
    if (w === "a") adv_a.push(dim(k));
    if (w === "b") adv_b.push(dim(k));
  }
  const rw = resVal(a) > resVal(b) ? "a" : resVal(a) < resVal(b) ? "b" : "tie";
  if (rw === "a") adv_a.push("Résistance");
  if (rw === "b") adv_b.push("Résistance");

  const biggest = ["D","G","S","P"]
    .map(k => ({ k, d: Math.abs(sc(a,k) - sc(b,k)) }))
    .sort((x,y) => y.d - x.d)[0]?.k || "D";

  return { adv_a, adv_b, biggest };
}

function MiniCard({ analysis, side }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4 flex flex-col gap-3">
      <div className="text-[10px] uppercase tracking-widest text-white/30">{side}</div>
      <div className="text-[12px] text-white/40">
        {[analysis?.artist, analysis?.year, analysis?.genre].filter(Boolean).join(" · ")}
      </div>
      <h3 className="font-serif text-lg text-white/85">{analysis?.title || "—"}</h3>
      <div className="flex flex-wrap gap-1.5">
        <BasisBadge value={analysis?.analysisBasis} />
        <ConfidenceBadge value={analysis?.overallConfidence} />
      </div>
      {analysis?.summary?.quickVerdict && (
        <p className="text-[13px] leading-relaxed text-white/50 line-clamp-3">
          {analysis.summary.quickVerdict}
        </p>
      )}
      <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-right self-end">
        <div className="text-[10px] uppercase tracking-widest text-white/30">Global</div>
        <div className="font-serif text-2xl text-white leading-none mt-0.5">
          {Number(analysis?.global || 0).toFixed(1)}
        </div>
      </div>
    </div>
  );
}

function Row({ left, right, name }) {
  const l = Number(left || 0), r = Number(right || 0);
  const state = Math.abs(l - r) < 0.15 ? "tie" : l > r ? "left" : "right";
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className={`rounded-lg px-3 py-2 text-center text-sm transition ${
        state === "left" ? "bg-white text-black font-medium" : "bg-white/5 text-white/50"
      }`}>
        {l.toFixed(1)}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-white/25 text-center w-20">{name}</div>
      <div className={`rounded-lg px-3 py-2 text-center text-sm transition ${
        state === "right" ? "bg-white text-black font-medium" : "bg-white/5 text-white/50"
      }`}>
        {r.toFixed(1)}
      </div>
    </div>
  );
}

export default function CompareView({ leftAnalysis, rightAnalysis }) {
  if (!leftAnalysis || !rightAnalysis) return null;
  const { adv_a, adv_b, biggest } = buildSummary(leftAnalysis, rightAnalysis);

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-white/8 bg-white/[0.03] p-6">
      <div>
        <h2 className="font-serif text-xl text-white/90 tracking-wide">Comparaison</h2>
        <p className="mt-1 text-sm text-white/40">Structure, preuve et résistance côte à côte.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MiniCard analysis={leftAnalysis}  side="Œuvre A" />
        <MiniCard analysis={rightAnalysis} side="Œuvre B" />
      </div>

      <div className="flex flex-col gap-2">
        <Row left={leftAnalysis?.global}  right={rightAnalysis?.global}  name="Global" />
        {["D","G","S","P"].map(k => (
          <Row key={k} left={sc(leftAnalysis,k)} right={sc(rightAnalysis,k)} name={dim(k)} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "A domine sur", items: adv_a },
          { label: "B domine sur", items: adv_b },
        ].map(({ label, items }) => (
          <div key={label} className="rounded-xl border border-white/6 bg-black/20 p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3">{label}</div>
            {items.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {items.map((x) => (
                  <span key={x} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-white/60">
                    {x}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/30 italic">Pas d'avantage net.</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/6 bg-black/20 p-4">
        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
          Différence la plus probante
        </div>
        <p className="text-[14px] leading-relaxed text-white/65">
          L'écart le plus net apparaît sur{" "}
          <span className="text-white font-medium">{dim(biggest)}</span>.
          C'est le meilleur point d'entrée pour expliquer pourquoi les deux œuvres
          ne produisent pas la même forme de richesse.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Résistance — Œuvre A", summary: leftAnalysis?.resistance?.summary },
          { label: "Résistance — Œuvre B", summary: rightAnalysis?.resistance?.summary },
        ].map(({ label, summary }) => (
          <div key={label} className="rounded-xl border border-white/6 bg-black/20 p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">{label}</div>
            <p className="text-[13px] leading-relaxed text-white/55">
              {summary || "Aucun constat exploitable."}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
