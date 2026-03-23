export default function RecoCard({ item }) {
  const a = item?.analysis;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 flex flex-col gap-3 hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="text-[12px] text-white/35">
            {[a?.artist, a?.year].filter(Boolean).join(" · ")}
          </div>
          <h4 className="font-serif text-base text-white/85">{a?.title || "Recommandation"}</h4>
        </div>
        <div className="shrink-0 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/30">Score</div>
          <div className="font-serif text-lg text-white/70 leading-none">
            {Number(a?.global || 0).toFixed(1)}
          </div>
        </div>
      </div>

      {a?.summary?.quickVerdict && (
        <p className="text-[13px] leading-relaxed text-white/50 line-clamp-2">
          {a.summary.quickVerdict}
        </p>
      )}

      {item?.reason && (
        <div className="rounded-lg border border-white/6 bg-black/20 px-3 py-2 text-[12px] text-white/40">
          {item.reason}
        </div>
      )}
    </div>
  );
}
