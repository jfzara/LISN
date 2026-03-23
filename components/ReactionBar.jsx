"use client";

const OPTIONS = [
  { key: "loved",     label: "Très moi" },
  { key: "liked",     label: "Ça me parle" },
  { key: "intrigued", label: "Surprenant" },
  { key: "disagreed", label: "Pas convaincu" },
];

export default function ReactionBar({ value = "neutral", onChange }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <div className="mb-3">
        <h3 className="font-serif text-base text-white/80 tracking-wide">Ta réaction</h3>
        <p className="mt-0.5 text-sm text-white/35">Aide LISN à affiner ton profil.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => {
          const active = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange?.(opt.key)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                active
                  ? "bg-white text-black font-medium"
                  : "border border-white/10 bg-black/20 text-white/60 hover:border-white/20 hover:text-white/80"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
