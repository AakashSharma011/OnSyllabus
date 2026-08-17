import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import EntityCard from "../components/EntityCard.jsx";
import client from "../api/client.js";

export default function SelectCollege() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    client.get("/colleges/").then(({ data }) => setColleges(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="browse-page">
      <Navbar />
      <div className="browse-content">
        <span className="eyebrow">Step 1 of 4</span>
        <h1 className="display browse-title">Choose your college</h1>
        <p className="browse-subtitle">We'll show content specific to your syllabus.</p>
        {loading && <p className="empty-state">Loading colleges...</p>}
        {!loading && colleges.length === 0 && <p className="empty-state">No colleges added yet.</p>}
        <div className="item-grid">
          {colleges.map((college, i) => (
            <EntityCard key={college.id} index={i} title={college.name} subtitle={college.university} onClick={() => navigate(`/branches?college_id=${college.id}`)} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}