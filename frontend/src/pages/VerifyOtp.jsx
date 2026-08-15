import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import ParticleField from "../components/ParticleField.jsx";
import client from "../api/client.js";
import { useAuth } from "../hooks/useAuth.js";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await client.post("/auth/verify-otp", { email, otp });
      login(data.access_token);
      navigate("/colleges");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <ParticleField />
      <form className="card" onSubmit={handleSubmit}>
        <h1 className="display" style={{ fontSize: 22, marginBottom: 4 }}>Verify your email</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
          Enter the 6-digit code we sent to your email.
        </p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="otp">Code</label>
          <input id="otp" type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required />
        </div>
        {error && <p style={{ color: "var(--accent-coral)", fontSize: 13, marginBottom: 14 }}>{error}</p>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify & continue"}
        </button>
        <p style={{ textAlign: "center", marginTop: 18 }}>
          <Link className="link-muted" to="/signup">Didn't get a code? Sign up again</Link>
        </p>
      </form>
    </div>
  );
}