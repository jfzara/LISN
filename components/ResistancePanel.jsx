export default function ResistancePanel({ resistance }) {
  if (!resistance) return null;
  return (
    <section className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-serif text-2xl text-black/90">Résistance</div>
          <div className="mt-1 text-sm text-black/55">{resistance.status || "Non établie"}</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-black/35">Score</div>
          <div className="font-serif text-3xl leading-none text-black">{resistance.score}</div>
        </div>
      </div>

      {resistance.summary ? <p className="mt-3 text-sm leading-relaxed text-black/65">{resistance.summary}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[['Différence minimale', resistance.minimalDifference], ['Perte traçable', resistance.traceableLoss], ['Dégradation croisée', resistance.crossDimDegradation]].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-black/8 bg-black/[0.02] p-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-black/35">{label}</div>
            <div className="mt-2 text-sm leading-relaxed text-black/65">{value || 'Non établi.'}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
