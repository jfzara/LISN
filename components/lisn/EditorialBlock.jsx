// /components/lisn/EditorialBlock.jsx

export default function EditorialBlock({ title, text }) {
  if (!text) return null;

  return (
    <div className="lisn-editorial-block">
      <div className="lisn-section-label">{title}</div>
      <p className="lisn-editorial-text">{text}</p>
    </div>
  );
}