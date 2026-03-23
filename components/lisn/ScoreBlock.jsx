// /components/lisn/ScoreBlock.jsx

export default function ScoreBlock({ score }) {
  return (
    <div className="lisn-score-block">
      <div className="lisn-score-number">{score}</div>
      <div className="lisn-score-label">Indice LISN</div>
    </div>
  );
}