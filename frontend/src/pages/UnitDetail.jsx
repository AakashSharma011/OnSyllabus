import Footer from "../components/Footer.jsx";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import VideoCard from "../components/VideoCard.jsx";
import NotesCard from "../components/NotesCard.jsx";
import client from "../api/client.js";

export default function UnitDetail() {
  const { unitId } = useParams();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/resources/?unit_id=${unitId}`).then(({ data }) => setResources(data)).finally(() => setLoading(false));
  }, [unitId]);

  const videos = resources.filter((r) => r.type === "video");
  const notes = resources.filter((r) => r.type !== "video");

  return (
    <div className="browse-page">
      <Navbar />
      <div className="browse-content">
        <h1 className="display browse-title">Curated content</h1>
        <p className="browse-subtitle">Videos and notes for this unit.</p>
        {loading && <p className="empty-state">Loading resources...</p>}
        {!loading && videos.length > 0 && (
          <>
            <h2 style={{ fontSize: 16, color: "var(--text-muted)", margin: "24px 0 12px" }}>Videos</h2>
            <div className="item-grid">{videos.map((r) => <VideoCard key={r.id} resource={r} />)}</div>
          </>
        )}
        {!loading && notes.length > 0 && (
          <>
            <h2 style={{ fontSize: 16, color: "var(--text-muted)", margin: "24px 0 12px" }}>Notes</h2>
            <div className="item-grid">{notes.map((r) => <NotesCard key={r.id} resource={r} />)}</div>
          </>
        )}
        {!loading && resources.length === 0 && <p className="empty-state">No resources added for this unit yet.</p>}
      </div>
      <Footer />
    </div>
  );
}