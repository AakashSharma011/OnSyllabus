import client from "../api/client.js";

export default function VideoCard({ resource }) {
  const thumbnail = resource.youtube_video_id
    ? `https://img.youtube.com/vi/${resource.youtube_video_id}/hqdefault.jpg`
    : null;

  const handleClick = async () => {
    try {
      await client.post(`/resources/${resource.id}/click`);
    } catch {
      // click logging is best-effort — don't block navigation if it fails
    }
    window.open(resource.url, "_blank", "noopener,noreferrer");
  };

  return (
    <button className="item-card" onClick={handleClick} style={{ padding: 0, overflow: "hidden" }}>
      {thumbnail && <img src={thumbnail} alt={resource.title} style={{ width: "100%", display: "block" }} />}
      <div style={{ padding: 16 }}>
        <h3>{resource.title}</h3>
      </div>
    </button>
  );
}