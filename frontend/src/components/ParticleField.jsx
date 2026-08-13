import { useEffect, useRef } from "react";

const COLORS = ["#4f8eff", "#a78bfa", "#ff6b6b", "#2dd4bf", "#fbbf24"];
const PARTICLE_COUNT = 48;

function createParticle(width, height) {
  const speed = 0.25 + Math.random() * 0.35;
  const angle = Math.random() * Math.PI * 2;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: 1.5 + Math.random() * 2.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

export default function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let particles = [];
    let sparks = [];
    let frameId;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    function init() {
      particles = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(canvas.offsetWidth, canvas.offsetHeight)
      );
    }

    function step() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        }
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      if (!reducedMotion) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < a.r + b.r + 18) {
              ctx.globalAlpha = (1 - dist / (a.r + b.r + 18)) * 0.25;
              ctx.strokeStyle = a.color;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
            if (dist < a.r + b.r) {
              [a.vx, b.vx] = [b.vx, a.vx];
              [a.vy, b.vy] = [b.vy, a.vy];
              sparks.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, life: 1 });
            }
          }
        }
      }

      ctx.globalAlpha = 1;
      sparks = sparks.filter((s) => s.life > 0);
      for (const s of sparks) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, (1 - s.life) * 14, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(241,241,246,${s.life * 0.4})`;
        ctx.stroke();
        s.life -= 0.05;
      }

      frameId = requestAnimationFrame(step);
    }

    resize();
    init();
    step();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}
    />
  );
}