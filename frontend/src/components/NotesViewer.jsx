export default function NotesViewer({ resource }) {
  return (
    <div className="notes-viewer">
      <iframe src={resource.url} title={resource.title} className="notes-iframe" />
      <div className="notes-viewer-footer">
        <span className="link-muted">Having trouble viewing?</span>
        <a className="link-muted" href={resource.url} target="_blank" rel="noopener noreferrer">Open in new tab →</a>
      </div>
    </div>
  );
}