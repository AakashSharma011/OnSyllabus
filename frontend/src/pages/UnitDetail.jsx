import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import VideoPlayer from "../components/VideoPlayer.jsx";
import NotesViewer from "../components/NotesViewer.jsx";
import client from "../api/client.js";

export default function UnitDetail() {
  const { unitId } = useParams();
  const [unit, setUnit] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("syllabus");
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeNote, setActiveNote] = useState(null);

  useEffect(() => {
    Promise.all([
      client.get(`/units/${unitId}`),
      client.get(`/resources/?unit_id=${unitId}`),
    ]).then(([unitRes, resourcesRes]) => {
      setUnit(unitRes.data);
      setResources(resourcesRes.data);
      const videos = resourcesRes.data.filter((r) => r.type === "video");
      const notes = resourcesRes.data.filter((r) => r.type !== "video");
      if (videos.length) setActiveVideo(videos[0]);
      if (notes.length) setActiveNote(notes[0]);
    }).finally(() => setLoading(false));
  }, [unitId]);

  const videos = resources.filter((r) => r.type === "video");
  const notes = resources.filter((r) => r.type !== "video");

  const logClick = async (id) => {
    try { await client.post(`/resources/${id}/click`); } catch { /* best-effort */ }
  };

  return (
    <div className="browse-page">
      <Navbar />
      <div className="browse-content">
        <span className="eyebrow">Unit</span>
        <h1 className="display browse-title">{loading ? "Loading..." : unit?.name}</h1>
        <p className="browse-subtitle">Syllabus, notes and videos for this unit.</p>

        <div className="tab-bar">
          <button className={`tab-btn ${tab === "syllabus" ? "active" : ""}`} onClick={() => setTab("syllabus")}>Syllabus</button>
          <button className={`tab-btn ${tab === "notes" ? "active" : ""}`} onClick={() => setTab("notes")}>Notes</button>
          <button className={`tab-btn ${tab === "videos" ? "active" : ""}`} onClick={() => setTab("videos")}>Videos</button>
        </div>

        {loading && <p className="empty-state">Loading...</p>}

        {!loading && tab === "syllabus" && (
          <p className="syllabus-text">{unit?.description || "No syllabus notes added for this unit yet."}</p>
        )}

        {!loading && tab === "notes" && (
          notes.length === 0 ? <p className="empty-state">No notes added for this unit yet.</p> : (
            <>
              <div className="notes-list">
                {notes.map((n) => (
                  <button key={n.id} className={`playlist-item ${activeNote?.id === n.id ? "active" : ""}`} onClick={() => { setActiveNote(n); logClick(n.id); }}>
                    <span>{n.title}</span>
                  </button>
                ))}
              </div>
              {activeNote && <NotesViewer resource={activeNote} />}
            </>
          )
        )}

        {!loading && tab === "videos" && (
          videos.length === 0 ? <p className="empty-state">No videos added for this unit yet.</p> : (
            <div className="video-layout">
              {activeVideo && <VideoPlayer resource={activeVideo} />}
              <div className="playlist">
                {videos.map((v) => (
                  <button key={v.id} className={`playlist-item ${activeVideo?.id === v.id ? "active" : ""}`} onClick={() => { setActiveVideo(v); logClick(v.id); }}>
                    {v.youtube_video_id && <img src={`https://img.youtube.com/vi/${v.youtube_video_id}/mqdefault.jpg`} alt={v.title} />}
                    <span>{v.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </div>
      <Footer />
    </div>
  );
}