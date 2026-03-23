export default function StructuralBadges({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-black/70">
          {item}
        </span>
      ))}
    </div>
  );
}
