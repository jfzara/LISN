import MicroJustification from "./MicroJustification";

export default function DimensionPanel({ card }) {
  return (
    <section className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-serif text-2xl text-black/90">{card.title}</div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-black/45">
            <span>{card.basis}</span>
            <span>·</span>
            <span>{card.confidence}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-black/35">Score</div>
          <div className="font-serif text-3xl leading-none text-black">{card.score}</div>
        </div>
      </div>
      <MicroJustification text={card.micro} />
      {card.bullets?.length ? (
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-black/65">
          {card.bullets.map((item) => (
            <li key={item} className="rounded-xl border border-black/8 bg-black/[0.02] px-3 py-2">{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
