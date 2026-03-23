// /components/lisn/RegimeBlock.jsx

export default function RegimeBlock({ regime }) {
  if (!regime) return null;

  return (
    <div className="lisn-regime-block">
      <div className="lisn-section-label">Régime structurel</div>

      <div className="lisn-regime-grid">
        <div><strong>Type :</strong> {regime.structureType}</div>
        <div><strong>Régime :</strong> {regime.compositionMode}</div>
        <div><strong>Template :</strong> {regime.templateDependence}</div>
        <div><strong>Exploration :</strong> {regime.exploration}</div>
        <div><strong>Contraintes :</strong> {regime.constraintLevel}</div>
        <div><strong>Fonction :</strong> {regime.dominantFunction}</div>
      </div>
    </div>
  );
}