// /components/lisn/VerdictBlock.jsx

export default function VerdictBlock({ verdict }) {
  if (!verdict?.text) return null;

  return (
    <div className="lisn-verdict-block">
      <div className="lisn-section-label">Verdict</div>
      <p className="lisn-verdict-text">“{verdict.text}”</p>
    </div>
  );
}