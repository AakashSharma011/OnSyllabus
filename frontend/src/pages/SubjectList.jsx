import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import EntityCard from "../components/EntityCard.jsx";
import client from "../api/client.js";

export default function SubjectList() {
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get("branch_id");
  const semester = searchParams.get("semester");
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!branchId) return;
    const query = semester ? `branch_id=${branchId}&semester=${semester}` : `branch_id=${branchId}`;
    client.get(`/subjects/?${query}`).then(({ data }) => setSubjects(data)).finally(() => setLoading(false));
  }, [branchId, semester]);

  return (
    <div className="browse-page">
      <Navbar />
      <div className="browse-content">
        <span className="eyebrow">Step 4 of 4</span>
        <h1 className="display browse-title">Choose your subject</h1>
        <p className="browse-subtitle">Pick a subject to see its units.</p>
        {loading && <p className="empty-state">Loading subjects...</p>}
        {!loading && subjects.length === 0 && <p className="empty-state">No subjects added for this semester yet.</p>}
        <div className="item-grid">
          {subjects.map((subject, i) => (
            <EntityCard key={subject.id} index={i} title={subject.name} subtitle={`Semester ${subject.semester}`} onClick={() => navigate(`/units?subject_id=${subject.id}`)} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}