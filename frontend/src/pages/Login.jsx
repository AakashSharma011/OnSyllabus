import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ParticleField from "../components/ParticleField.jsx";
import client from "../api/client.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await client.post("/auth/login", { email, password });
      localStorage.setItem("access_token", data.access_token);
      navigate("/colleges");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split">
      <div className="split-panel split-panel--visual">
        <ParticleField />
        <div className="float-chip" style={{ left: "12%", bottom: 0, animationDelay: "0s", borderColor: "var(--accent-blue)" }}>
          Data Structures
        </div>
        <div className="float-chip" style={{ left: "55%", bottom: 0, animationDelay: "3s", borderColor: "var(--accent-violet)" }}>
          Engineering Maths
        </div>
        <div className="float-chip" style={{ left: "30%", bottom: 0, animationDelay: "6s", borderColor: "var(--accent-teal)" }}>
          Digital Electronics
        </div>
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2 className="display" style={{ fontSize: 32, lineHeight: 1.25, marginBottom: 12 }}>
            Stop watching<br />the wrong lecture.
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 340 }}>
            Every video and note here is mapped to your exact syllabus, unit by unit.
          </p>
        </div>
      </div>

      <div className="split-panel split-panel--form">
        <form className="card card--plain" onSubmit={handleSubmit} style={{ maxWidth: 340 }}>
          <h1 className="display" style={{ fontSize: 22, marginBottom: 4 }}>Welcome back</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
            Log in to pick up where you left off.
          </p>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <p style={{ color: "var(--accent-coral)", fontSize: 13, marginBottom: 14 }}>{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>

          <p style={{ textAlign: "center", marginTop: 18 }}>
            <Link className="link-muted" to="/signup">New here? Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}