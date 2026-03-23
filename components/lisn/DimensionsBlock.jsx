// /components/lisn/DimensionsBlock.jsx

export default function DimensionsBlock({ score }) {
  if (!score) {
    return null;
  }

  const dimensions = [
    { label: "Density", value: score?.density ?? 0 },
    { label: "Tension", value: score?.tension ?? 0 },
    { label: "Resolution", value: score?.resolution ?? 0 },
    { label: "Singularity", value: score?.singularity ?? 0 },
    { label: "Depth", value: score?.depth ?? 0 },
    { label: "Grain", value: score?.grain ?? 0 },
    { label: "Resistance", value: score?.resistance ?? 0 }
  ];

  return (
    <div className="lisn-dimensions">
      <div className="lisn-section-label">Dimensions structurelles</div>

      {dimensions.map((d) => (
        <div key={d.label} className="lisn-dimension-row">
          <div className="lisn-dimension-label">{d.label}</div>
          <div className="lisn-dimension-value">{d.value}</div>
          <div className="lisn-bar">
            <div
              className="lisn-bar-fill"
              style={{ width: `${d.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}