import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import React from "react";

/* ── Themes ────────────────────────────────────────────────────────────────── */

export type ThemeVariant = "homme" | "femme";

interface Theme {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  bgEnd: string;
  glowRgb: string;
  confettiColors: string[];
}

const THEMES: Record<ThemeVariant, Theme> = {
  homme: {
    primary: "#3B82F6",
    primaryDark: "#2563EB",
    primaryLight: "#60A5FA",
    bgEnd: "#DBEAFE",
    glowRgb: "59,130,246",
    confettiColors: ["#3B82F6", "#2563EB", "#60A5FA", "#93C5FD", "#DBEAFE", "#FFFFFF", "#1D4ED8", "#BFDBFE"],
  },
  femme: {
    primary: "#EC4899",
    primaryDark: "#DB2777",
    primaryLight: "#F472B6",
    bgEnd: "#FCE7F3",
    glowRgb: "236,72,153",
    confettiColors: ["#EC4899", "#DB2777", "#F472B6", "#F9A8D4", "#FCE7F3", "#FFFFFF", "#BE185D", "#FBCFE8"],
  },
};

/* ── Props ─────────────────────────────────────────────────────────────────── */

export interface ScoreNumber1Props {
  athleteName: string;
  score: string;
  theme: ThemeVariant;
}

/* ── Confetti ──────────────────────────────────────────────────────────────── */

interface Particle {
  x: number; y: number; rotation: number; scale: number;
  color: string; speed: number; drift: number; shape: "rect" | "circle";
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function generateParticles(colors: string[]): Particle[] {
  return Array.from({ length: 80 }, (_, i) => ({
    x: seededRandom(i * 7 + 1) * 1920,
    y: -50 - seededRandom(i * 3 + 2) * 400,
    rotation: seededRandom(i * 11 + 3) * 360,
    scale: 0.5 + seededRandom(i * 13 + 4) * 1,
    color: colors[Math.floor(seededRandom(i * 17 + 5) * colors.length)],
    speed: 3 + seededRandom(i * 19 + 6) * 6,
    drift: (seededRandom(i * 23 + 7) - 0.5) * 3,
    shape: seededRandom(i * 29 + 8) > 0.5 ? "rect" : "circle",
  }));
}

const ConfettiLayer: React.FC<{ frame: number; colors: string[] }> = ({ frame, colors }) => {
  const confettiStart = 35;
  
  const particles = React.useMemo(() => generateParticles(colors), [colors]);

  if (frame < confettiStart) return null;

  const t = frame - confettiStart;

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const y = p.y + t * p.speed * 4;
        const x = p.x + Math.sin(t * 0.05 + i) * p.drift * 30;
        const rot = p.rotation + t * (2 + p.speed);
        const opacity = interpolate(t, [0, 10, 90, 115], [0, 1, 1, 0], { extrapolateRight: "clamp" });
        if (y > 1200) return null;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            width: p.shape === "rect" ? 12 : 10,
            height: p.shape === "rect" ? 20 : 10,
            borderRadius: p.shape === "circle" ? "50%" : 3,
            backgroundColor: p.color,
            transform: `rotate(${rot}deg) scale(${p.scale})`,
            opacity,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

/* ── Podium ────────────────────────────────────────────────────────────────── */

const Podium: React.FC<{ frame: number; fps: number; t: Theme }> = ({ frame, fps, t }) => {
  const rise = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 80, mass: 1.2 } });
  const podiumHeight = 340 * rise;
  const podiumWidth = 400;

  return (
    <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: podiumWidth, height: podiumHeight, perspective: 600 }}>
      <div style={{ position: "absolute", bottom: 0, width: podiumWidth, height: podiumHeight, background: `linear-gradient(135deg, ${t.primary}, ${t.primaryDark})`, borderRadius: "8px 8px 0 0", boxShadow: `0 -4px 30px rgba(${t.glowRgb}, 0.4)` }} />
      <div style={{ position: "absolute", bottom: podiumHeight, width: podiumWidth, height: 40, background: `linear-gradient(180deg, ${t.primaryLight}, ${t.primary})`, borderRadius: "8px 8px 0 0", transform: "skewX(-4deg)" }} />
      <div style={{ position: "absolute", bottom: 0, right: -20, width: 20, height: podiumHeight, background: `linear-gradient(180deg, ${t.primaryDark}, ${t.primaryDark})`, transform: "skewY(-10deg)", transformOrigin: "bottom left" }} />
      <div style={{ position: "absolute", bottom: 0, width: podiumWidth, height: podiumHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "Inter, Segoe UI, system-ui, sans-serif", fontSize: 140, fontWeight: 900, color: "rgba(255,255,255,0.25)", letterSpacing: -4 }}>
          #1
        </span>
      </div>
    </div>
  );
};

/* ── Main composition ──────────────────────────────────────────────────────── */

export const ScoreNumber1: React.FC<ScoreNumber1Props> = ({ athleteName, score, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = THEMES[theme];

  const bgOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const flashOpacity = interpolate(frame, [38, 42, 50], [0, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const leaderSpring = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 120, mass: 0.8 } });
  const leaderY = interpolate(leaderSpring, [0, 1], [-80, 0]);
  const leaderOpacity = interpolate(frame, [5, 15, 120, 140], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const nameSpring = spring({ frame: frame - 50, fps, config: { damping: 14, stiffness: 100, mass: 1 } });
  const nameY = interpolate(nameSpring, [0, 1], [60, 0]);
  const nameOpacity = interpolate(frame, [50, 60, 120, 140], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const scoreSpring = spring({ frame: frame - 65, fps, config: { damping: 12, stiffness: 90, mass: 1 } });
  const scoreScale = interpolate(scoreSpring, [0, 1], [0.3, 1]);
  const scoreOpacity = interpolate(frame, [65, 75, 120, 140], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const glowScale = interpolate(frame, [35, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const glowOpacity = interpolate(frame, [35, 50, 110, 130], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const globalOpacity = interpolate(frame, [0, 5, 130, 150], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: globalOpacity, background: `linear-gradient(135deg, #F0F4F8 0%, #E2E8F0 40%, ${t.bgEnd} 100%)`, fontFamily: "Inter, Segoe UI, system-ui, sans-serif" }}>
      <AbsoluteFill style={{ opacity: bgOpacity, background: `radial-gradient(ellipse at 50% 70%, rgba(${t.glowRgb},0.12) 0%, transparent 70%)` }} />
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flashOpacity }} />

      {/* Glow ring */}
      <div style={{ position: "absolute", bottom: 200, left: "50%", width: 500, height: 500, transform: `translate(-50%, 50%) scale(${glowScale})`, opacity: glowOpacity, borderRadius: "50%", background: `radial-gradient(circle, rgba(${t.glowRgb},0.3) 0%, rgba(${t.glowRgb},0.05) 50%, transparent 70%)` }} />

      <Podium frame={frame} fps={fps} t={t} />

      {/* Text block */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ opacity: leaderOpacity, transform: `translateY(${leaderY}px)` }}>
          <span style={{ fontSize: 72, fontWeight: 900, color: "#1E293B", textTransform: "uppercase", letterSpacing: 8, textShadow: `0 2px 20px rgba(${t.glowRgb},0.3)` }}>
            Nouveau Leader!
          </span>
        </div>
        <div style={{ opacity: nameOpacity, transform: `translateY(${nameY}px)` }}>
          <span style={{ fontSize: 96, fontWeight: 900, color: t.primary, textTransform: "uppercase", letterSpacing: 4 }}>
            {athleteName}
          </span>
        </div>
        <div style={{ opacity: scoreOpacity, transform: `scale(${scoreScale})` }}>
          <span style={{ fontSize: 160, fontWeight: 900, color: "#1E293B", letterSpacing: -2 }}>
            {score}
          </span>
          <span style={{ fontSize: 40, fontWeight: 600, color: "#64748B", marginLeft: 16, textTransform: "uppercase", letterSpacing: 3 }}>
            pts
          </span>
        </div>
      </div>

      <ConfettiLayer frame={frame} colors={t.confettiColors} />
    </AbsoluteFill>
  );
};
