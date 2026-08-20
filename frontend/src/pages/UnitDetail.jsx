import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import VideoPlayer from "../components/VideoPlayer.jsx";
import NotesViewer from "../components/NotesViewer.jsx";
import ResourceList from "../components/ResourceList.jsx";
import client from "../api/client.js";

const TABS = [
  { key: "syllabus", label: "Syllabus" },
  { key: "notes", label: "Notes" },
  { key: "playlist", label: "Playlist" },
  { key: "books", label: "Books" },
  { key: "pyq", label: "PYQ" },
];

export default function UnitDetail() {
  const { unitId } = useParams();
  const [unit, setUnit] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("syllabus");
  const [activeItem, setActiveItem] = useState({});

  useEffect(() => {
    Promise.all([
      client.get(`/units/${unitId}`),
      client.get(`/resources/?unit_id=${unitId}`),
    ]).then(([unitRes, resourcesRes]) => {
      setUnit(unitRes.data);
      setResources(resourcesRes.data);
      const firstByType = {};
      for (const r of resourcesRes.data) {
        if (!firstByType[r.type]) firstByType[r.type] = r;
      }
      setActiveItem(firstByType);
    }).finally(() => setLoading(false));
  }, [unitId]);

  const logClick = async (id) => {
    try { await client.post(`/resources/${id}/click`); } catch { /* best-effort */ }
  };

  const byType = (t) => resources.filter((r) => r.type === t);

  const selectItem = (type, resource) => {
    setActiveItem((prev) => ({ ...prev, [type]: resource }));
    logClick(resource.id);
  };

  const renderTabContent = () => {
    if (tab === "syllabus") {
      return <p className="syllabus-text">{unit?.description || "No syllabus notes added for this unit yet."}</p>;
    }

    const items = byType(tab);
    const active = activeItem[tab];

    if (tab === "playlist") {
      return items.length === 0 ? (
        <p className="empty-state">No playlist videos added yet.</p>
      ) : (
        <div className="video-layout">
          {active && <VideoPlayer resource={active} />}
          <div className="playlist">
            {items.map((v) => (
              <button key={v.id} className={`playlist-item ${active?.id === v.id ? "active" : ""}`} onClick={() => selectItem(tab, v)}>
                {v.youtube_video_id && <img src={`https://img.youtube.com/vi/${v.youtube_video_id}/mqdefault.jpg`} alt={v.title} />}
                <span>{v.title}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <>
        <ResourceList
          resources={items}
          activeId={active?.id}
          onSelect={(r) => selectItem(tab, r)}
          emptyText={`No ${tab} added for this unit yet.`}
        />
        {active && <NotesViewer resource={active} />}
      </>
    );
  };

  return (
    <div className="browse-page">
      <Navbar />
      <div className="browse-content">
        <span className="eyebrow">Unit</span>
        <h1 className="display browse-title">{loading ? "Loading..." : unit?.name}</h1>
        <p className="browse-subtitle">Everything for this unit, organized by type.</p>

        <div className="tab-segment">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab-segment-btn ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <p className="empty-state">Loading...</p> : <div style={{ marginTop: 24 }}>{renderTabContent()}</div>}
      </div>
      <Footer />
    </div>
  );
}