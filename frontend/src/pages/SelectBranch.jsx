import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
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
        <h1 className="display browse-title">Choose your branch</h1>
        <p className="browse-subtitle">Pick the branch you're studying.</p>
        {loading && <p className="empty-state">Loading branches...</p>}
        {!loading && branches.length === 0 && <p className="empty-state">No branches added for this college yet.</p>}
        <div className="item-grid">
          {branches.map((branch) => (
            <button key={branch.id} className="item-card" onClick={() => navigate(`/subjects?branch_id=${branch.id}`)}>
              <h3>{branch.name}</h3>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}