// /components/lisn/HeaderBlock.jsx

export default function HeaderBlock({ entity, meta }) {
  if (!entity) return null;

  return (
    <div className="lisn-header">
      <div className="lisn-entity-type">
        {entity.type?.toUpperCase()}
      </div>

      <h1 className="lisn-title">
        {entity.title}
      </h1>

      <div className="lisn-subtitle">
        {entity.artist}
        {entity.album && ` — ${entity.album}`}
        {entity.year && ` (${entity.year})`}
      </div>

      <div className="lisn-meta">
        Mode : {meta?.mode === "deep" ? "Approfondi" : "Rapide"}
        {meta?.analysisTime && ` · ${meta.analysisTime} ms`}
      </div>
    </div>
  );
}