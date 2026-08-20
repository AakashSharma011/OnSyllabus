export default function ResourceList({ resources, activeId, onSelect, emptyText }) {
  if (resources.length === 0) return <p className="empty-state">{emptyText}</p>;
  return (
    <div className="notes-list">
      {resources.map((r) => (
        <button
          key={r.id}
          className={`playlist-item ${activeId === r.id ? "active" : ""}`}
          onClick={() => onSelect(r)}
        >
          <span>{r.title}</span>
        </button>
      ))}
    </div>
  );
}