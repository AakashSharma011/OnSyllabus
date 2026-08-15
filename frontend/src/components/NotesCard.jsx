import client from "../api/client.js";

export default function NotesCard({ resource }) {
  const handleClick = async () => {
    try {
      await client.post(`/resources/${resource.id}/click`);
    } catch {
      // best-effort logging
    }
    window.open(resource.url, "_blank", "noopener,noreferrer");
  };

  return (
    <button className="item-card" onClick={handleClick}>
      <h3>{resource.title}</h3>
      <p>Notes →</p>
    </button>
  );
}