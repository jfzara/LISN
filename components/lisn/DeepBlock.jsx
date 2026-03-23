// /components/lisn/DeepBlock.jsx

export default function DeepBlock({ deep }) {
  if (!deep) return null;

  return (
    <div className="lisn-deep-block">
      {deep.worldview && (
        <>
          <div className="lisn-section-label">Vision du monde</div>
          <p>{deep.worldview}</p>
        </>
      )}

      {deep.psychologicalFunction && (
        <>
          <div className="lisn-section-label">Fonction psychologique</div>
          <p>{deep.psychologicalFunction}</p>
        </>
      )}

      {deep.fullAnalysis && (
        <>
          <div className="lisn-section-label">Analyse approfondie</div>
          <p>{deep.fullAnalysis}</p>
        </>
      )}
    </div>
  );
}