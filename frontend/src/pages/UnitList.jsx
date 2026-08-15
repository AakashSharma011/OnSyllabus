import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import client from "../api/client.js";

export default function UnitList() {
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get("subject_id");
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!subjectId) return;
    client.get(`/units/?subject_id=${subjectId}`).then(({ data }) => setUnits(data)).finally(() => setLoading(false));
  }, [subjectId]);

  return (
    <div className="browse-page">
      <Navbar />
      <div className="browse-content">
        <h1 className="display browse-title">Units</h1>
        <p className="browse-subtitle">Pick a unit to see curated videos and notes.</p>
        {loading && <p className="empty-state">Loading units...</p>}
        {!loading && units.length === 0 && <p className="empty-state">No units added for this subject yet.</p>}
        <div className="item-grid">
          {units.map((unit) => (
            <button key={unit.id} className="item-card" onClick={() => navigate(`/unit/${unit.id}`)}>
              <h3>{unit.name}</h3>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}