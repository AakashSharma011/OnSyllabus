import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import ParticleField from "../components/ParticleField.jsx";

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );

    if (ref.current) obs.observe(ref.current);

    return () => obs.disconnect();
  }, []);

  return [ref, visible];
}

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 400 360"
      style={{ width: "100%", maxWidth: 400 }}
    >
      <defs>
        <linearGradient
          id="bookGrad"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="#4f8eff" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      <ellipse
        cx="200"
        cy="320"
        rx="140"
        ry="16"
        fill="rgba(79,142,255,0.08)"
      />

      <g transform="translate(90,110)">
        <path
          d="M0 20 Q60 -10 120 20 L120 160 Q60 130 0 160 Z"
          fill="url(#bookGrad)"
          opacity="0.9"
        />

        <path
          d="M120 20 Q180 -10 240 20 L240 160 Q180 130 120 160 Z"
          fill="url(#bookGrad)"
          opacity="0.7"
        />

        <line
          x1="120"
          y1="20"
          x2="120"
          y2="160"
          stroke="#0a0b14"
          strokeWidth="3"
          opacity="0.4"
        />
      </g>

      <circle
        cx="210"
        cy="120"
        r="34"
        fill="#0a0b14"
        stroke="#2dd4bf"
        strokeWidth="3"
      />

      <path
        d="M200 106 L226 120 L200 134 Z"
        fill="#2dd4bf"
      />

      <g
        fontFamily="Inter, sans-serif"
        fontSize="11"
        fontWeight="600"
      >
        <rect
          x="30"
          y="60"
          width="86"
          height="28"
          rx="8"
          fill="rgba(255,107,107,0.12)"
          stroke="#ff6b6b"
          strokeWidth="1"
        />

        <text
          x="73"
          y="78"
          fill="#ff6b6b"
          textAnchor="middle"
        >
          Unit 3 · DS
        </text>

        <rect
          x="270"
          y="200"
          width="100"
          height="28"
          rx="8"
          fill="rgba(251,191,36,0.12)"
          stroke="#fbbf24"
          strokeWidth="1"
        />

        <text
          x="320"
          y="218"
          fill="#fbbf24"
          textAnchor="middle"
        >
          Notes ready
        </text>
      </g>
    </svg>
  );
}

export default function Home() {
  const [aboutRef, aboutVisible] = useReveal();

  return (
    <div style={{ background: "var(--bg)" }}>
      <nav className="navbar">
        <img
          src="/logo.png"
          alt="OnSyllabus"
          style={{ height: 42 }}
        />

        <Link
          to="/login"
          className="btn-ghost"
          style={{ textDecoration: "none" }}
        >
          Login
        </Link>
      </nav>

      <section className="page hero-section">
        <ParticleField />

        <div className="hero-grid">
          <div style={{ position: "relative", zIndex: 2 }}>
            <span className="eyebrow">
              MAIT · GGSIPU and beyond
            </span>

            <h1
              className="display"
              style={{
                fontSize: 46,
                lineHeight: 1.15,
                marginBottom: 16,
              }}
            >
              Your syllabus.
              <br />
              Perfectly curated.
            </h1>

            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 16,
                marginBottom: 28,
                maxWidth: 420,
              }}
            >
              Every video and note, mapped exactly to your
              college, branch, semester and unit.
            </p>

            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/signup"
                className="btn-primary"
                style={{
                  display: "inline-block",
                  width: "auto",
                  padding: "14px 32px",
                  textDecoration: "none",
                }}
              >
                Get started free
              </Link>

              <Link
                to="/login"
                className="btn-ghost"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  textDecoration: "none",
                  padding: "14px 28px",
                }}
              >
                Login
              </Link>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <HeroIllustration />
          </div>
        </div>
      </section>

      <section
        ref={aboutRef}
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "80px 24px",
          display: "flex",
          gap: 48,
          alignItems: "center",
          flexWrap: "wrap",
          opacity: aboutVisible ? 1 : 0,
          transform: aboutVisible
            ? "translateY(0)"
            : "translateY(24px)",
          transition:
            "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <img
          src="/founder.jpg"
          alt="Aakash Sharma"
          style={{
            width: 220,
            height: 220,
            objectFit: "cover",
            borderRadius: 20,
            border: "1px solid var(--border)",
            flexShrink: 0,
          }}
        />

        <div>
          <span className="eyebrow">Who built this</span>

          <h2
            className="display"
            style={{
              fontSize: 30,
              marginBottom: 10,
            }}
          >
            Aakash Sharma
          </h2>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 15,
              lineHeight: 1.7,
              marginBottom: 6,
            }}
          >
            Electronics &amp; Communication Engineering,
            Maharaja Agrasen Institute of Technology
          </p>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 15,
              lineHeight: 1.7,
              marginBottom: 6,
            }}
          >
            Batch of 2022–2026 · Branch Rank 1 · Mr. ECE at
            Farewell
          </p>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              lineHeight: 1.7,
              marginTop: 14,
            }}
          >
            Built OnSyllabus to fix what every first-year
            struggles with — finding the right lecture, fast.
          </p>
        </div>
      </section>
    </div>
  );
}