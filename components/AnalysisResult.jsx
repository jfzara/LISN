import DimensionCard from "./DimensionCard";
import ResistanceCard from "./ResistanceCard";
import { BasisBadge, ConfidenceBadge } from "./Badges";

function TasteTag({ value }) {
  if (!value || value === "NEUTRE") return null;
  const map = {
    VALIDE: { label: "Intuition validée", cls: "text-emerald-300 border-emerald-500/30 bg-emerald-900/20" },
    CHALLENGE: { label: "Intuition challengée", cls: "text-rose-300 border-rose-500/30 bg-rose-900/20" },
    MIXTE: { label: "Résultat mixte", cls: "text-amber-300 border-amber-500/30 bg-amber-900/20" },
  };
  const { label, cls } = map[value] || {};
  if (!label) return null;
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default function AnalysisResult({ analysis }) {
  if (!analysis) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <div className="text-sm text-white/40 tracking-wide">
              {[analysis.artist, analysis.year, analysis.genre].filter(Boolean).join(" · ")}
            </div>
            <h2 className="font-serif text-3xl text-white tracking-wide leading-tight">
              {analysis.title || "Analyse LISN"}
            </h2>
            {analysis.summary?.hook && (
              <p className="text-[15px] leading-relaxed text-white/65 max-w-2xl">
                {analysis.summary.hook}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <BasisBadge value={analysis.analysisBasis} />
              <ConfidenceBadge value={analysis.overallConfidence} />
              <TasteTag value={analysis.summary?.tasteRelation} />
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-right">
            <div className="text-[10px] uppercase tracking-widest text-white/35">Score global</div>
            <div className="font-serif text-5xl text-white leading-none mt-1">
              {Number(analysis.global || 0).toFixed(1)}
            </div>
          </div>
        </div>

        {analysis.summary?.quickVerdict && (
          <div className="mt-5 rounded-2xl border border-white/6 bg-black/20 p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
              Verdict rapide
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              {analysis.summary.quickVerdict}
            </p>
          </div>
        )}

        {analysis.notifications?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {analysis.notifications.map((note, i) => (
              <span
                key={i}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[12px] text-white/50"
              >
                {note}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Dimensions 2x2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {["D", "G", "S", "P"].map((code) => (
          <DimensionCard key={code} code={code} data={analysis.dimensions?.[code]} />
        ))}
      </div>

      {/* Résistance */}
      <ResistanceCard resistance={analysis.resistance} />

      {/* Lecture approfondie */}
      {analysis.deep && (
        <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3">
            Lecture approfondie
          </div>
          <p className="text-[15px] leading-relaxed text-white/65 whitespace-pre-line">
            {analysis.deep}
          </p>
        </section>
      )}

      {/* Erreur */}
      {analysis.error && (
        <section className="rounded-2xl border border-rose-500/20 bg-rose-900/10 p-4">
          <div className="text-sm font-medium text-rose-300">Erreur</div>
          <p className="mt-1 text-sm text-rose-200/80">{analysis.error}</p>
        </section>
      )}
    </div>
  );
}
