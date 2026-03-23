export default function MicroJustification({ text }) {
  if (!text) return null;
  return <p className="mt-2 text-sm leading-relaxed text-black/65">{text}</p>;
}
