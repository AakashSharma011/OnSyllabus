export default function NotesViewer({ resource, onClose }) {
  return (
    <div className="notes-modal-overlay" onClick={onClose}>
      <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notes-modal-header">
          <span>{resource.title}</span>
          <button className="notes-modal-close" onClick={onClose}>✕</button>
        </div>
        <iframe src={resource.url} title={resource.title} className="notes-modal-iframe" />
      </div>
    </div>
  );
}