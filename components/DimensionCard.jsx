import { BasisBadge, ConfidenceBadge } from "./Badges";

const LABELS = { D: "Densité", G: "Grain", S: "Singularité", P: "Profondeur" };

export default function DimensionCard({ code, data }) {
  const label = LABELS[code] || code;
  const score = Number(data?.score || 0).toFixed(1);

  return (
    <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h3 className="font-serif text-lg text-white/90 tracking-wide">{label}</h3>
          <div className="flex flex-wrap gap-1.5">
            <BasisBadge value={data?.basis} />
            <ConfidenceBadge value={data?.confidence} />
          </div>
        </div>
        <div className="shrink-0 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/35">Score</div>
          <div className="font-serif text-2xl text-white leading-none mt-0.5">{score}</div>
        </div>
      </div>

      {data?.justification ? (
        <p className="text-sm leading-relaxed text-white/65">{data.justification}</p>
      ) : (
        <p className="text-sm text-white/30 italic">Justification indisponible.</p>
      )}

      {code === "D" && data?.constraints?.length > 0 && (
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-widest text-white/30">
            Contraintes actives
          </div>
          <ul className="flex flex-col gap-1.5">
            {data.constraints.map((item, i) => (
              <li
                key={i}
                className="rounded-lg border border-white/6 bg-black/20 px-3 py-2 text-[13px] text-white/60"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {code === "G" && data?.sourcesType?.length > 0 && (
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-widest text-white/30">
            Sources / indices
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.sourcesType.map((item, i) => (
              <span
                key={i}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[12px] text-white/55"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
