import { BasisBadge, ConfidenceBadge } from "./Badges";

function statusLabel(s) {
  return { CONFIRMEE: "Confirmée", PARTIELLE: "Partielle", NON_ETABLIE: "Non établie", NON_APPLICABLE: "Non applicable" }[s] || s;
}
function typeLabel(t) {
  return { STASE: "Stase", FRICTION_TEMPORELLE: "Friction temporelle", ECONOMIE_DE_PLACEMENT: "Économie de placement", AUTRE: "Autre", AUCUNE: "Aucune" }[t] || t;
}
function statusColor(s) {
  return s === "CONFIRMEE"    ? "text-emerald-400"
       : s === "PARTIELLE"    ? "text-amber-400"
       : s === "NON_ETABLIE"  ? "text-orange-400"
                              : "text-white/35";
}

export default function ResistanceCard({ resistance }) {
  const status = resistance?.status || "NON_APPLICABLE";
  const type = resistance?.type || "AUCUNE";
  const showOsrn = status !== "NON_APPLICABLE" && status !== "NON_ETABLIE";

  return (
    <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h3 className="font-serif text-lg text-white/90 tracking-wide">Résistance</h3>
          <div className={`text-sm font-medium ${statusColor(status)}`}>
            {statusLabel(status)}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <BasisBadge value={resistance?.basis} />
            <ConfidenceBadge value={resistance?.confidence} />
          </div>
        </div>
        <div className="shrink-0 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/35">Type</div>
          <div className="text-sm font-medium text-white/70 mt-0.5 max-w-[120px] text-right">
            {typeLabel(type)}
          </div>
        </div>
      </div>

      {resistance?.summary ? (
        <p className="text-sm leading-relaxed text-white/65">{resistance.summary}</p>
      ) : (
        <p className="text-sm text-white/30 italic">Aucun constat de résistance exploitable.</p>
      )}

      {showOsrn && (
        <div className="flex flex-col gap-2">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
            Test OSR-N
          </div>
          {[
            { label: "Différence minimale",        value: resistance?.osrn?.minimalDifference },
            { label: "Perte relationnelle traçable", value: resistance?.osrn?.traceableLoss },
            { label: "Dégradation interdimensionnelle", value: resistance?.osrn?.crossDimDegradation },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/6 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{label}</div>
              <p className="text-[13px] leading-relaxed text-white/60">
                {value || "Non renseigné."}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
