// /components/lisn/BadgesBlock.jsx

export default function BadgesBlock({ badges }) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="lisn-badges-block">
      {badges.map((badge, i) => (
        <div key={i} className="lisn-badge">
          {badge}
        </div>
      ))}
    </div>
  );
}