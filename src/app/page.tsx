"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/* ─── Avatar (initials) ─── */
const Avatar = ({ name, gender, size = 70 }: { name: string; gender: string; size?: number }) => {
  const letter = name?.charAt(0)?.toUpperCase() || "?";
  const isMale = gender === "Homme" || gender === "H";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: isMale ? "linear-gradient(135deg, #4a90d9, #357abd)" : "linear-gradient(135deg, #d94a8a, #bd357a)",
      border: `3px solid ${isMale ? "#5b9bd5" : "#d55b9b"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 4px 15px rgba(0,0,0,0.2), 0 0 20px ${isMale ? "rgba(74,144,217,0.25)" : "rgba(217,74,138,0.25)"}`,
      color: "white", fontWeight: 800, fontSize: size * 0.4, flexShrink: 0,
    }}>
      {letter}
    </div>
  );
};

/* ─── Podium Card ─── */
const PodiumCard = ({ score, rank, isMale }: { score: any; rank: number; isMale: boolean }) => {
  const heights: Record<number, string> = { 1: "min(130px, 18vh)", 2: "min(100px, 14vh)", 3: "min(85px, 12vh)" };
  const avatarSizes: Record<number, number> = { 1: 80, 2: 65, 3: 65 };
  const rankColor = isMale ? "#4a7fbd" : "#bd4a7f";
  const delay = rank === 1 ? "0s" : rank === 2 ? "0.5s" : "1s";

  if (!score) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
        <div style={{ height: heights[rank], width: "100%", maxWidth: "160px", background: "rgba(0,0,0,0.03)", borderRadius: "10px 10px 0 0" }} />
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
      zIndex: rank === 1 ? 5 : 1,
      animation: `podiumFloat 4s ease-in-out ${delay} infinite`,
    }}>
      <Avatar name={score.participants?.first_name || ""} gender={score.participants?.category || ""} size={avatarSizes[rank]} />
      <div style={{
        width: "100%", maxWidth: "160px", height: heights[rank], marginTop: "-12px",
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)",
        borderRadius: "10px 10px 4px 4px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0.5rem",
        transform: "perspective(800px) rotateX(2deg)", transformOrigin: "bottom center",
        border: "1px solid rgba(255,255,255,0.7)",
      }}>
        <span style={{ fontSize: "clamp(1.2rem, 2vw, 1.6rem)", fontWeight: 900, color: rankColor }}>{rank}</span>
        <span style={{
          fontSize: "clamp(0.7rem, 1.2vw, 0.95rem)", fontWeight: 700, color: "#1e293b",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "140px", textAlign: "center",
        }}>
          {score.participants?.first_name} . {score.participants?.last_name?.charAt(0)}
        </span>
        <span style={{ fontSize: "clamp(0.85rem, 1.3vw, 1.1rem)", fontWeight: 800, color: "#475569", marginTop: "2px" }}>
          {score.value}
        </span>
      </div>
    </div>
  );
};

/* ─── Leaderboard Column ─── */
const LeaderboardColumn = ({ title, data, isMale }: { title: string; data: any[]; isMale: boolean }) => {
  const bgTint = isMale
    ? "linear-gradient(180deg, rgba(215,228,248,0.7) 0%, rgba(230,238,252,0.4) 100%)"
    : "linear-gradient(180deg, rgba(248,215,230,0.7) 0%, rgba(252,230,240,0.4) 100%)";
  const titleColor = isMale ? "#4a7fbd" : "#bd4a7f";
  const borderTint = isMale ? "rgba(74,127,189,0.12)" : "rgba(189,74,127,0.12)";

  return (
    <div style={{
      flex: 1, background: bgTint, borderRadius: "clamp(14px, 2vw, 22px)", padding: "clamp(1.2rem, 2.5vw, 2.5rem)",
      display: "flex", flexDirection: "column",
      backdropFilter: "blur(12px)", border: `1px solid ${borderTint}`,
      boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
    }}>
      <h2 style={{ color: titleColor, fontSize: "clamp(1rem, 1.8vw, 1.5rem)", fontWeight: 700, fontStyle: "italic", margin: "0 0 clamp(1rem, 2vw, 2rem)" }}>
        {title}
      </h2>

      {data.length === 0 ? (
        <p style={{ color: "#94a3b8", fontStyle: "italic", textAlign: "center", marginTop: "3rem" }}>
          Aucune performance enregistrée...
        </p>
      ) : (
        <>
          {/* Podium */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "clamp(6px, 1.5vw, 14px)", marginBottom: "clamp(1.5rem, 3vw, 3rem)", justifyContent: "center", minHeight: "clamp(180px, 28vh, 280px)" }}>
            <PodiumCard rank={2} score={data[1]} isMale={isMale} />
            <PodiumCard rank={1} score={data[0]} isMale={isMale} />
            <PodiumCard rank={3} score={data[2]} isMale={isMale} />
          </div>

          {/* Ranks 4-8 Card */}
          <div style={{
            background: "rgba(255,255,255,0.8)", borderRadius: "clamp(8px, 1.2vw, 14px)",
            overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            border: "1px solid rgba(255,255,255,0.6)",
          }}>
            {/* Header */}
            <div style={{
              display: "flex", padding: "clamp(0.5rem, 1vw, 0.8rem) clamp(0.8rem, 1.5vw, 1.4rem)",
              fontWeight: 700, fontSize: "clamp(0.65rem, 0.9vw, 0.8rem)", color: "#64748b",
              textTransform: "uppercase", letterSpacing: "0.06em",
              borderBottom: `1px solid ${borderTint}`,
            }}>
              <span style={{ width: "clamp(35px, 5vw, 55px)" }}>Rank</span>
              <span style={{ flex: 1 }}>Athlete</span>
              <span style={{ width: "clamp(50px, 7vw, 80px)", textAlign: "right" }}>Points</span>
            </div>

            {data.length > 3 ? (
              data.slice(3, 8).map((score, idx) => (
                <div key={score.id} style={{
                  display: "flex", alignItems: "center",
                  padding: "clamp(0.6rem, 1vw, 0.9rem) clamp(0.8rem, 1.5vw, 1.4rem)",
                  borderBottom: idx < Math.min(data.length - 4, 4) ? "1px solid rgba(0,0,0,0.04)" : "none",
                  background: idx % 2 === 0 ? "rgba(255,255,255,0.5)" : "transparent",
                }}>
                  <span style={{ width: "clamp(35px, 5vw, 55px)", fontWeight: 700, color: "#475569", fontSize: "clamp(0.8rem, 1vw, 1rem)" }}>
                    {idx + 4}
                  </span>
                  <span style={{ flex: 1, display: "flex", alignItems: "center", gap: "clamp(0.3rem, 0.6vw, 0.5rem)" }}>
                    <Avatar name={score.participants?.first_name || ""} gender={score.participants?.category || ""} size={28} />
                    <strong style={{ color: "#1e293b", fontSize: "clamp(0.8rem, 1vw, 0.95rem)" }}>
                      {score.participants?.first_name} . {score.participants?.last_name?.charAt(0)}
                    </strong>
                  </span>
                  <span style={{ width: "clamp(50px, 7vw, 80px)", textAlign: "right", fontWeight: 800, color: "#475569", fontSize: "clamp(0.85rem, 1.1vw, 1.05rem)" }}>
                    {score.value}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: "clamp(1rem, 2vw, 1.5rem)", textAlign: "center", color: "#94a3b8", fontSize: "clamp(0.75rem, 1vw, 0.88rem)", fontStyle: "italic" }}>
                En attente des places 4 à 8...
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Dense Dynamic Background ─── */
const GeometricBackground = () => {
  const shapes = [
    // Large orbs
    { type: "circle", top: "3%", left: "6%", size: 100, color: "rgba(74,144,217,0.08)", dur: "13s", delay: "0s" },
    { type: "circle", top: "55%", left: "88%", size: 120, color: "rgba(217,74,138,0.07)", dur: "17s", delay: "1s" },
    { type: "circle", top: "35%", left: "48%", size: 150, color: "rgba(130,130,200,0.04)", dur: "21s", delay: "2.5s" },
    { type: "circle", top: "80%", left: "30%", size: 80, color: "rgba(100,200,180,0.06)", dur: "15s", delay: "0.5s" },
    // Triangles
    { type: "triangle", top: "8%", left: "72%", size: 65, color: "rgba(139,92,246,0.09)", dur: "11s", delay: "0.3s" },
    { type: "triangle", top: "70%", left: "12%", size: 60, color: "rgba(74,127,189,0.08)", dur: "14s", delay: "1.8s" },
    { type: "triangle", top: "28%", left: "94%", size: 50, color: "rgba(200,130,160,0.07)", dur: "18s", delay: "3.5s" },
    { type: "triangle", top: "88%", left: "58%", size: 55, color: "rgba(100,180,220,0.07)", dur: "13s", delay: "1.2s" },
    { type: "triangle", top: "50%", left: "3%", size: 45, color: "rgba(200,160,80,0.06)", dur: "16s", delay: "2s" },
    // Diamonds
    { type: "diamond", top: "18%", left: "28%", size: 40, color: "rgba(180,120,200,0.08)", dur: "10s", delay: "0.7s" },
    { type: "diamond", top: "60%", left: "4%", size: 45, color: "rgba(100,160,220,0.07)", dur: "19s", delay: "2.2s" },
    { type: "diamond", top: "12%", left: "52%", size: 35, color: "rgba(220,100,130,0.06)", dur: "12s", delay: "3s" },
    { type: "diamond", top: "75%", left: "70%", size: 50, color: "rgba(74,200,150,0.06)", dur: "15s", delay: "0.8s" },
    // Hexagons
    { type: "hexagon", top: "42%", left: "18%", size: 55, color: "rgba(139,92,246,0.07)", dur: "16s", delay: "1s" },
    { type: "hexagon", top: "22%", left: "82%", size: 45, color: "rgba(74,200,180,0.06)", dur: "20s", delay: "2.8s" },
    { type: "hexagon", top: "90%", left: "85%", size: 40, color: "rgba(200,100,100,0.05)", dur: "14s", delay: "0.4s" },
    // Small floating dots
    { type: "circle", top: "92%", left: "38%", size: 22, color: "rgba(74,144,217,0.1)", dur: "8s", delay: "0s" },
    { type: "circle", top: "2%", left: "38%", size: 28, color: "rgba(200,100,180,0.09)", dur: "9s", delay: "0.8s" },
    { type: "circle", top: "48%", left: "68%", size: 20, color: "rgba(100,200,150,0.09)", dur: "7s", delay: "1.5s" },
    { type: "circle", top: "65%", left: "42%", size: 25, color: "rgba(200,180,100,0.08)", dur: "10s", delay: "0.3s" },
    { type: "circle", top: "15%", left: "15%", size: 18, color: "rgba(74,127,189,0.1)", dur: "9s", delay: "2s" },
    { type: "circle", top: "38%", left: "78%", size: 15, color: "rgba(217,74,138,0.09)", dur: "8s", delay: "1.2s" },
    { type: "circle", top: "82%", left: "52%", size: 16, color: "rgba(139,92,246,0.08)", dur: "11s", delay: "0.6s" },
    { type: "circle", top: "55%", left: "25%", size: 20, color: "rgba(100,180,220,0.08)", dur: "10s", delay: "3s" },
    // Extra medium shapes for density
    { type: "triangle", top: "45%", left: "40%", size: 35, color: "rgba(180,140,200,0.05)", dur: "22s", delay: "4s" },
    { type: "diamond", top: "5%", left: "60%", size: 30, color: "rgba(74,144,217,0.06)", dur: "13s", delay: "1.5s" },
    { type: "hexagon", top: "68%", left: "50%", size: 38, color: "rgba(200,130,100,0.05)", dur: "18s", delay: "2.5s" },
    { type: "triangle", top: "95%", left: "20%", size: 42, color: "rgba(100,140,200,0.06)", dur: "15s", delay: "0.5s" },
  ];

  return (
    <>
      {shapes.map((s, i) => {
        let borderRadius = "0";
        let clipPath: string | undefined;
        if (s.type === "circle") borderRadius = "50%";
        else if (s.type === "triangle") clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
        else if (s.type === "diamond") clipPath = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
        else if (s.type === "hexagon") clipPath = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
        return (
          <div key={i} style={{
            position: "absolute", top: s.top, left: s.left, width: s.size, height: s.size,
            background: s.color, borderRadius, clipPath,
            animation: `geo${i % 5} ${s.dur} ease-in-out ${s.delay} infinite`,
            pointerEvents: "none", zIndex: 0,
          }} />
        );
      })}
    </>
  );
};

/* ═══════════════════════════════════════ */
export default function Home() {
  const [scoresHommes, setScoresHommes] = useState<any[]>([]);
  const [scoresFemmes, setScoresFemmes] = useState<any[]>([]);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }));

    const fetchScores = async () => {
      const { data } = await supabase
        .from("scores")
        .select(`id, value, recorded_at, participant_id, participants (id, first_name, last_name, category, age_category)`)
        .order("value", { ascending: false });

      if (data) {
        const bestMap = new Map();
        for (const s of data) { if (!bestMap.has(s.participant_id)) bestMap.set(s.participant_id, s); }
        const all = Array.from(bestMap.values());
        setScoresHommes(all.filter(s => s.participants?.category === "Homme" || s.participants?.category === "H").slice(0, 8));
        setScoresFemmes(all.filter(s => s.participants?.category === "Femme" || s.participants?.category === "F").slice(0, 8));
      }
    };

    fetchScores();
    const channel = supabase.channel("realtime-scores")
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, () => fetchScores())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <main style={{
      minHeight: "100vh", margin: 0, position: "relative", overflow: "hidden",
      background: "linear-gradient(160deg, #edf1f7 0%, #e4e8f0 30%, #f2e8ee 70%, #edf1f7 100%)",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      color: "#1e293b", padding: 0,
    }}>
      <GeometricBackground />

      {/* Pulsating gradient overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 20% 30%, rgba(74,144,217,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(217,74,138,0.05) 0%, transparent 50%)",
        animation: "pulseOverlay 6s ease-in-out infinite alternate",
      }} />

      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "clamp(0.8rem, 1.5vw, 1.5rem) clamp(1.5rem, 3vw, 4rem)",
        position: "relative", zIndex: 10,
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        background: "rgba(255,255,255,0.4)", backdropFilter: "blur(20px)",
      }}>
        <h1 style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.3rem)", fontWeight: 700, color: "#334155", margin: 0 }}>
          Classement Jump Contest
        </h1>
        <span style={{ fontSize: "clamp(0.8rem, 1.2vw, 1.05rem)", color: "#94a3b8", fontWeight: 500 }}>
          {dateStr}
        </span>
      </header>

      {/* Content — responsive grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "clamp(1rem, 2.5vw, 3rem)",
        padding: "clamp(1rem, 2.5vw, 3rem) clamp(1.5rem, 3vw, 4rem)",
        position: "relative", zIndex: 10,
        maxWidth: "2200px", margin: "0 auto",
        minHeight: "calc(100vh - 60px)",
        alignContent: "start",
      }}>
        <LeaderboardColumn title="Classement Masculin" data={scoresHommes} isMale={true} />
        <LeaderboardColumn title="Classement Féminin" data={scoresFemmes} isMale={false} />
      </div>

      {/* Admin link */}
      <div style={{ position: "fixed", bottom: "clamp(0.5rem, 1vw, 1.5rem)", right: "clamp(1rem, 2vw, 2.5rem)", zIndex: 20 }}>
        <Link href="/login" style={{ fontSize: "clamp(0.65rem, 0.8vw, 0.85rem)", color: "rgba(0,0,0,0.12)", textDecoration: "none" }}>
          Accès Panel
        </Link>
      </div>

      <style>{`
        @keyframes podiumFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes geo0 {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 0.6; }
          25%  { transform: translate(22px, -28px) rotate(50deg); opacity: 1; }
          50%  { transform: translate(-12px, -18px) rotate(110deg); opacity: 0.4; }
          75%  { transform: translate(18px, -32px) rotate(220deg); opacity: 0.9; }
          100% { transform: translate(0, 0) rotate(360deg); opacity: 0.6; }
        }
        @keyframes geo1 {
          0%   { transform: translate(0, 0) rotate(0deg) scale(1); }
          33%  { transform: translate(-20px, -24px) rotate(130deg) scale(1.18); }
          66%  { transform: translate(14px, -38px) rotate(250deg) scale(0.88); }
          100% { transform: translate(0, 0) rotate(360deg) scale(1); }
        }
        @keyframes geo2 {
          0%   { transform: translate(0, 0) rotate(0deg); }
          20%  { transform: translate(28px, -12px) rotate(75deg); }
          40%  { transform: translate(-8px, -34px) rotate(150deg); }
          60%  { transform: translate(-22px, -10px) rotate(225deg); }
          80%  { transform: translate(12px, -26px) rotate(300deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        @keyframes geo3 {
          0%   { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50%  { transform: translate(-18px, -28px) scale(1.25); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
        }
        @keyframes geo4 {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
          30%  { transform: translate(15px, -22px) rotate(100deg); opacity: 0.4; }
          60%  { transform: translate(-20px, -15px) rotate(200deg); opacity: 1; }
          100% { transform: translate(0, 0) rotate(360deg); opacity: 0.7; }
        }
        @keyframes pulseOverlay {
          0%   { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
