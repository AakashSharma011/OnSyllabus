const ACCENTS = ["#4f8eff", "#a78bfa", "#ff6b6b", "#2dd4bf", "#fbbf24"];

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ResourceList({ resources, activeId, onSelect, emptyText }) {
  if (resources.length === 0) return <p className="empty-state">{emptyText}</p>;
  return (
    <div className="resource-grid" style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {resources.map((r, i) => {
        const hex = ACCENTS[i % ACCENTS.length];
        return (
          <button
            key={r.id}
            className="entity-card"
            style={{ animationDelay: `${i * 0.05}s`, width: 260, flex: "0 0 auto" }}
            onClick={() => onSelect(r)}
          >
            <div
              className="entity-avatar"
              style={{ background: hexToRgba(hex, 0.12), borderColor: hexToRgba(hex, 0.4), color: hex }}
            >
              {r.title.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3>{r.title}</h3>
            </div>
          </button>
        );
      })}
    </div>
  );
}