import RecoCard from "./RecoCard";

export default function Recommendations({ sameDNA = [], adjacent = [] }) {
  if (!sameDNA.length && !adjacent.length) return null;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h3 className="font-serif text-xl text-white/90 tracking-wide">Recommandations LISN</h3>
        <p className="mt-1 text-sm text-white/40">
          Ce qui te ressemble — et ce qui pourrait t'ouvrir.
        </p>
      </div>

      {sameDNA.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="text-[10px] uppercase tracking-widest text-white/30">Même ADN</div>
            <div className="flex-1 h-px bg-white/6" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {sameDNA.map((item, i) => (
              <RecoCard key={`same-${item?.id || i}`} item={item} />
            ))}
          </div>
        </div>
      )}

      {adjacent.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="text-[10px] uppercase tracking-widest text-white/30">Adjacent intéressant</div>
            <div className="flex-1 h-px bg-white/6" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {adjacent.map((item, i) => (
              <RecoCard key={`adj-${item?.id || i}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
