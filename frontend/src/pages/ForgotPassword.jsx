import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ParticleField from "../components/ParticleField.jsx";
import client from "../api/client.js";

export default function ForgotPassword() {
  const [stage, setStage] = useState("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestCode = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await client.post("/auth/forgot-password", { email });
      setStage("reset");
    } catch {
      setError("Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await client.post("/auth/reset-password", { email, otp, new_password: newPassword });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Reset failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <ParticleField />
      <form className="card" onSubmit={stage === "request" ? requestCode : resetPassword}>
        <h1 className="display" style={{ fontSize: 22, marginBottom: 4 }}>
          {stage === "request" ? "Reset your password" : "Enter reset code"}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
          {stage === "request" ? "We'll email you a code if the account exists." : "Check your inbox for the 6-digit code."}
        </p>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={stage === "reset"} />
        </div>

        {stage === "reset" && (
          <>
            <div className="field">
              <label htmlFor="otp">Code</label>
              <input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
            </div>
            <div className="field">
              <label htmlFor="newPassword">New password</label>
              <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
            </div>
          </>
        )}

        {error && <p style={{ color: "var(--accent-coral)", fontSize: 13, marginBottom: 14 }}>{error}</p>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Please wait..." : stage === "request" ? "Send code" : "Reset password"}
        </button>

        <p style={{ textAlign: "center", marginTop: 18 }}>
          <Link className="link-muted" to="/login">Back to login</Link>
        </p>
      </form>
    </div>
  );
}