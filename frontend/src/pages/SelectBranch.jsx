import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import EntityCard from "../components/EntityCard.jsx";
import client from "../api/client.js";

export default function SelectBranch() {
  const [searchParams] = useSearchParams();
  const collegeId = searchParams.get("college_id");
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!collegeId) return;
    client.get(`/branches/?college_id=${collegeId}`).then(({ data }) => setBranches(data)).finally(() => setLoading(false));
  }, [collegeId]);

  return (
    <div className="browse-page">
      <Navbar />
      <div className="browse-content">
        <span className="eyebrow">Step 2 of 4</span>
        <h1 className="display browse-title">Choose your branch</h1>
        <p className="browse-subtitle">Pick the branch you're studying.</p>
        {loading && <p className="empty-state">Loading branches...</p>}
        {!loading && branches.length === 0 && <p className="empty-state">No branches added for this college yet.</p>}
        <div className="item-grid">
          {branches.map((branch, i) => (
            <EntityCard key={branch.id} index={i} title={branch.name} onClick={() => navigate(`/semesters?branch_id=${branch.id}`)} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}