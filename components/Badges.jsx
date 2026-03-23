export function BasisBadge({ value }) {
  const map = { DOCUMENTE: "Documenté", INFERE: "Inféré", EXPLORATOIRE: "Exploratoire" };
  const cls =
    value === "DOCUMENTE"
      ? "bg-emerald-900/40 text-emerald-300 ring-1 ring-emerald-500/30"
      : value === "INFERE"
      ? "bg-amber-900/40 text-amber-300 ring-1 ring-amber-500/30"
      : "bg-zinc-800/60 text-zinc-400 ring-1 ring-zinc-600/30";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] tracking-wide uppercase ${cls}`}>
      {map[value] || "Inféré"}
    </span>
  );
}

export function ConfidenceBadge({ value }) {
  const map = {
    HAUTE: "Haute", MOYENNE: "Moyenne", BASSE: "Basse", INSUFFISANTE: "Insuffisante",
  };
  const cls =
    value === "HAUTE"         ? "bg-sky-900/40 text-sky-300 ring-1 ring-sky-500/30"
    : value === "MOYENNE"     ? "bg-blue-900/40 text-blue-300 ring-1 ring-blue-500/30"
    : value === "BASSE"       ? "bg-orange-900/40 text-orange-300 ring-1 ring-orange-500/30"
                              : "bg-rose-900/40 text-rose-300 ring-1 ring-rose-500/30";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] tracking-wide uppercase ${cls}`}>
      {map[value] || "Moyenne"}
    </span>
  );
}
