import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Navbar() {
  const { logout, isAdmin } = useAuth();
  return (
    <nav className="navbar">
      <Link to="/colleges" className="navbar-logo">
        <img src="/logo.png" alt="OnSyllabus" />
      </Link>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        {isAdmin && <Link to="/admin" className="link-muted">Add content</Link>}
        <button className="link-muted" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={logout}>
          Log out
        </button>
      </div>
    </nav>
  );
}