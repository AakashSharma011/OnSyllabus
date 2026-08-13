import { useEffect, useState } from "react";

function BookCharacter({ color, mirrored, phase }) {
  const shoulderX = mirrored ? 25 : 125;
  const armEndX = mirrored ? 10 : 140;

  return (
    <svg width="150" height="140" viewBox="0 0 150 140" style={{ overflow: "visible", display: "block" }}>
      <rect x="25" y="5" width="100" height="130" rx="10" fill={color} />
      <rect x="72" y="5" width="6" height="130" fill="rgba(10,11,20,0.35)" />

      <circle
        cx="55" cy="55" r="5" fill="#0a0b14"
        className={phase === "wink" ? "eye-wink" : ""}
      />
      <circle cx="95" cy="55" r="5" fill="#0a0b14" />

      <path d="M55 80 Q75 96 95 80" stroke="#0a0b14" strokeWidth="4" fill="none" strokeLinecap="round" />

      <g className={phase === "wave" ? "hand-wave" : ""} style={{ transformOrigin: `${shoulderX}px 70px` }}>
        <line x1={shoulderX} y1="70" x2={armEndX} y2="70" stroke={color} strokeWidth="10" strokeLinecap="round" />
        <circle cx={armEndX} cy="70" r="9" fill="#ffcf9e" />
      </g>
    </svg>
  );
}

const PHASES = ["walk", "wink", "wave", "hold", "spin", "text", "settle", "fade"];
const DURATIONS = [1300, 800, 1100, 600, 1450, 1150, 900, 500];

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
    let elapsed = 0;
    const timers = PHASES.map((p, i) => {
      elapsed += i === 0 ? 0 : DURATIONS[i - 1];
      return setTimeout(() => setPhase(p), elapsed);
    });
    const totalTime = DURATIONS.reduce((a, b) => a + b, 0);
    timers.push(setTimeout(onComplete, totalTime));
    return () => timers.forEach(clearTimeout);
  }, [onComplete, reducedMotion]);

  if (reducedMotion) {
    return (
      <div style={overlayStyle}>
        <h1 className="display" style={{ fontSize: 44, color: "#f1f1f6" }}>OnSyllabus</h1>
      </div>
    );
  }

  const arrived = phase !== "walk";
  const holding = phase === "hold" || phase === "spin";
  const spinning = phase === "spin";
  const showText = phase === "text" || phase === "settle" || phase === "fade";
  const fadingOut = phase === "fade";

  const gap = holding ? 58 : 95;

  return (
    <div style={{ ...overlayStyle, opacity: fadingOut ? 0 : 1, transition: "opacity 0.5s ease" }}>
      <div
        className={spinning ? "duo-spin" : ""}
        style={{
          position: "relative",
          width: 420,
          height: 160,
          opacity: showText ? 0 : 1,
          transition: "opacity 0.4s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            marginLeft: -75,
            transform: `translateX(${arrived ? -gap : -350}px)`,
            transition: "transform 1.1s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <BookCharacter color="#4f8eff" mirrored={false} phase={phase} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            marginLeft: -75,
            transform: `translateX(${arrived ? gap : 350}px)`,
            transition: "transform 1.1s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <BookCharacter color="#a78bfa" mirrored={true} phase={phase} />
        </div>
      </div>

      {showText && (
        <h1 className="display text-grow-in" style={{ fontSize: 52, color: "#f1f1f6", position: "absolute" }}>
          OnSyllabus
        </h1>
      )}
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "#0a0b14",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};