import { useEffect, useState } from "react";

function BookCharacter({ color, mirrored }) {
  return (
    <svg width="150" height="140" viewBox="0 0 150 140" style={{ overflow: "visible", display: "block" }}>
      <rect x="25" y="5" width="100" height="130" rx="10" fill={color} />
      <rect x="72" y="5" width="6" height="130" fill="rgba(10,11,20,0.35)" />
      <circle cx="55" cy="55" r="5" fill="#0a0b14" />
      <circle cx="95" cy="55" r="5" fill="#0a0b14" />
      <path d="M55 80 Q75 96 95 80" stroke="#0a0b14" strokeWidth="4" fill="none" strokeLinecap="round" />
      <line
        x1={mirrored ? 25 : 125}
        y1="70"
        x2={mirrored ? 10 : 140}
        y2="70"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx={mirrored ? 10 : 140} cy="70" r="9" fill="#ffcf9e" />
    </svg>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "#0a0b14",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

export default function LogoIntro({ onComplete }) {
  const [phase, setPhase] = useState("walk");
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
    const timers = [
      setTimeout(() => setPhase("meet"), 60),
      setTimeout(() => setPhase("spark"), 1200),
      setTimeout(() => setPhase("text"), 1750),
      setTimeout(() => setPhase("fade"), 3000),
      setTimeout(() => onComplete(), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete, reducedMotion]);

  if (reducedMotion) {
    return (
      <div style={overlayStyle}>
        <h1 className="display" style={{ fontSize: 44, color: "#f1f1f6" }}>OnSyllabus</h1>
      </div>
    );
  }

  const met = phase !== "walk";
  const booksVisible = phase !== "text" && phase !== "fade";
  const showSpark = phase === "spark";
  const showText = phase === "text" || phase === "fade";
  const fadingOut = phase === "fade";

  return (
    <div style={{ ...overlayStyle, opacity: fadingOut ? 0 : 1, transition: "opacity 0.5s ease" }}>
      {booksVisible && (
        <div style={{ position: "relative", width: 420, height: 160 }}>
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              marginLeft: -75,
              transform: met ? "translateX(-95px)" : "translateX(-60vw)",
              transition: "transform 1.1s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <BookCharacter color="#4f8eff" mirrored={false} />
          </div>
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              marginLeft: -75,
              transform: met ? "translateX(95px)" : "translateX(60vw)",
              transition: "transform 1.1s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <BookCharacter color="#a78bfa" mirrored={true} />
          </div>
          {showSpark && (
            <div
              style={{
                position: "absolute",
                top: 70,
                left: "50%",
                width: 20,
                height: 20,
                marginLeft: -10,
                borderRadius: "50%",
                background: "radial-gradient(circle, #fbbf24, transparent 70%)",
                animation: "spark-pop 0.6s ease-out forwards",
              }}
            />
          )}
        </div>
      )}

      {showText && (
        <h1 className="display intro-text" style={{ fontSize: 48, color: "#f1f1f6" }}>
          OnSyllabus
        </h1>
      )}
    </div>
  );
}