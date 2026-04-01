import { useEffect, useState } from "react";

export function SplashScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 2300;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct < 100) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "linear-gradient(135deg, #050c1f 0%, #0a1628 50%, #060d20 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {/* Ambient glow blobs */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "10%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Pulsing ring */}
      <div className="splash-ring" style={{ marginBottom: 36 }}>
        <div className="splash-ring-inner">
          <span style={{ fontSize: 28, lineHeight: 1 }}>⚡</span>
        </div>
      </div>

      {/* Brand name */}
      <h1
        className="splash-title"
        style={{
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          background:
            "linear-gradient(90deg, #00d4ff 0%, #4f8fff 40%, #a78bfa 80%, #00d4ff 100%)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          margin: 0,
          animation: "shimmer 2.5s linear infinite",
        }}
      >
        TechNova Insights
      </h1>

      {/* Tagline */}
      <p
        style={{
          marginTop: 14,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontSize: "0.85rem",
          fontWeight: 500,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(180,200,240,0.55)",
        }}
      >
        Marketing&nbsp;&nbsp;•&nbsp;&nbsp;Sales&nbsp;&nbsp;•&nbsp;&nbsp;Service
      </p>

      {/* Progress bar container */}
      <div
        style={{
          marginTop: 52,
          width: "min(340px, 80vw)",
          height: 3,
          borderRadius: 99,
          background: "rgba(255,255,255,0.07)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            borderRadius: 99,
            background: "linear-gradient(90deg, #00d4ff, #4f8fff, #a78bfa)",
            boxShadow:
              "0 0 10px rgba(0,212,255,0.7), 0 0 20px rgba(79,143,255,0.4)",
            transition: "width 0.05s linear",
          }}
        />
      </div>

      {/* Loading text */}
      <p
        style={{
          marginTop: 18,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontSize: "0.72rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(150,180,230,0.35)",
        }}
      >
        Loading
      </p>
    </div>
  );
}
