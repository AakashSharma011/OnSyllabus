const ACCENTS = [
  { hex: "#4f8eff" },
  { hex: "#a78bfa" },
  { hex: "#ff6b6b" },
  { hex: "#2dd4bf" },
  { hex: "#fbbf24" },
];

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function EntityCard({ index = 0, title, subtitle, onClick }) {
  const { hex } = ACCENTS[index % ACCENTS.length];
  return (
    <button className="entity-card" onClick={onClick} style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="entity-avatar" style={{ background: hexToRgba(hex, 0.12), borderColor: hexToRgba(hex, 0.4), color: hex }}>
        {title.charAt(0).toUpperCase()}
      </div>
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </button>
  );
}