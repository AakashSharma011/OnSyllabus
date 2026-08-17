import Footer from "../components/Footer.jsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
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
        <h1 className="display browse-title">Choose your college</h1>
        <p className="browse-subtitle">We'll show content specific to your syllabus.</p>
        {loading && <p className="empty-state">Loading colleges...</p>}
        {!loading && colleges.length === 0 && <p className="empty-state">No colleges added yet.</p>}
        <div className="item-grid">
          {colleges.map((college) => (
            <button key={college.id} className="item-card" onClick={() => navigate(`/branches?college_id=${college.id}`)}>
              <h3>{college.name}</h3>
              <p>{college.university}</p>
            </button>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}