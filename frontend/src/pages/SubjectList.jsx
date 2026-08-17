import Footer from "../components/Footer.jsx";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import client from "../api/client.js";

export default function SubjectList() {
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get("branch_id");
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!branchId) return;
    client.get(`/subjects/?branch_id=${branchId}`).then(({ data }) => setSubjects(data)).finally(() => setLoading(false));
  }, [branchId]);

  return (
    <div className="browse-page">
      <Navbar />
      <div className="browse-content">
        <h1 className="display browse-title">Choose your subject</h1>
        <p className="browse-subtitle">Pick a subject to see its units.</p>
        {loading && <p className="empty-state">Loading subjects...</p>}
        {!loading && subjects.length === 0 && <p className="empty-state">No subjects added for this branch yet.</p>}
        <div className="item-grid">
          {subjects.map((subject) => (
            <button key={subject.id} className="item-card" onClick={() => navigate(`/units?subject_id=${subject.id}`)}>
              <h3>{subject.name}</h3>
              <p>Semester {subject.semester}</p>
            </button>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}