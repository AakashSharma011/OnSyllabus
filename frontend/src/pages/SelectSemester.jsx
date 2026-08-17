import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import client from "../api/client.js";

export default function SelectSemester() {
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get("branch_id");
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!branchId) return;
    client.get(`/subjects/semesters?branch_id=${branchId}`).then(({ data }) => setSemesters(data)).finally(() => setLoading(false));
  }, [branchId]);

  return (
    <div className="browse-page">
      <Navbar />
      <div className="browse-content">
        <span className="eyebrow">Step 3 of 4</span>
        <h1 className="display browse-title">Choose your semester</h1>
        <p className="browse-subtitle">We'll narrow subjects down to this semester.</p>
        {loading && <p className="empty-state">Loading semesters...</p>}
        {!loading && semesters.length === 0 && <p className="empty-state">No subjects added for this branch yet.</p>}
        <div className="item-grid">
          {semesters.map((sem, i) => (
            <button key={sem} className="semester-card" style={{ animationDelay: `${i * 0.05}s` }} onClick={() => navigate(`/subjects?branch_id=${branchId}&semester=${sem}`)}>
              <span className="semester-number">{sem}</span>
              <span className="semester-label">Semester {sem}</span>
            </button>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}