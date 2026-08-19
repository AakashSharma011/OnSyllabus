import { useAuth } from "../hooks/useAuth.js";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ParticleField from "../components/ParticleField.jsx";
import client from "../api/client.js";

const CHIPS = [
  {
    label: "Data Structures",
    color: "var(--accent-blue)",
    left: "10%",
    delay: "0s",
  },
  {
    label: "Engineering Maths",
    color: "var(--accent-violet)",
    left: "30%",
    delay: "1.8s",
  },
  {
    label: "Digital Electronics",
    color: "var(--accent-teal)",
    left: "50%",
    delay: "3.6s",
  },
  {
    label: "DBMS",
    color: "var(--accent-coral)",
    left: "68%",
    delay: "5.4s",
  },
  {
    label: "Operating Systems",
    color: "var(--accent-amber)",
    left: "85%",
    delay: "7.2s",
  },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data } = await client.post("/auth/login", {
        email,
        password,
      });

      login(data.access_token);
      navigate("/colleges");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split">
      {/* Left Visual Panel */}
      <div
        className="split-panel split-panel--visual"
        style={{
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 80,
        }}
      >
        <ParticleField />

        {CHIPS.map((chip) => (
          <div
            key={chip.label}
            className="float-chip"
            style={{
              left: chip.left,
              bottom: 0,
              animationDelay: chip.delay,
              borderColor: chip.color,
            }}
          >
            {chip.label}
          </div>
        ))}

        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            maxWidth: 380,
          }}
        >
          <h2
            className="display"
            style={{
              fontSize: 32,
              lineHeight: 1.25,
              marginBottom: 12,
            }}
          >
            Stop watching
            <br />
            the wrong lecture.
          </h2>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
            }}
          >
            Every video and note here is mapped to your exact syllabus,
            unit by unit.
          </p>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="split-panel split-panel--form">
        <form
          className="card card--plain"
          onSubmit={handleSubmit}
          style={{
            maxWidth: 340,
            textAlign: "center",
          }}
        >
          <div className="logo-chip">
            <img src="/logo.png" alt="OnSyllabus" />
          </div>

          <h1
            className="display"
            style={{
              fontSize: 22,
              marginBottom: 4,
              textAlign: "left",
            }}
          >
            Welcome back
          </h1>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              marginBottom: 24,
              textAlign: "left",
            }}
          >
            Log in to pick up where you left off.
          </p>

          {/* Email */}
          <div className="field" style={{ textAlign: "left" }}>
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="field" style={{ textAlign: "left" }}>
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Error */}
          {error && (
            <p
              style={{
                color: "var(--accent-coral)",
                fontSize: 13,
                marginBottom: 14,
                textAlign: "left",
              }}
            >
              {error}
            </p>
          )}

          {/* Login Button */}
          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          {/* Forgot Password */}
          <p
            style={{
              textAlign: "right",
              marginBottom: 16,
              marginTop: 4,
            }}
          >
            <Link
              className="link-muted"
              to="/forgot-password"
            >
              Forgot password?
            </Link>
          </p>

          {/* Signup */}
          <p
            style={{
              textAlign: "center",
              marginTop: 18,
            }}
          >
            <Link
              className="link-muted"
              to="/signup"
            >
              New here? Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}