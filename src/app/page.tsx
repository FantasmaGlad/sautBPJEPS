"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/* ─── Avatar (initials) ─── */
const Avatar = ({ name, gender, size = 70 }: { name: string; gender: string; size?: number }) => {
  const letter = name?.charAt(0)?.toUpperCase() || "?";
  const isMale = gender === "Homme" || gender === "H";
  const bg = isMale
    ? "linear-gradient(135deg, #4a90d9, #357abd)"
    : "linear-gradient(135deg, #d94a8a, #bd357a)";
  const border = isMale ? "#5b9bd5" : "#d55b9b";

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, border: `3px solid ${border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 4px 15px rgba(0,0,0,0.2), 0 0 20px ${isMale ? "rgba(74,144,217,0.25)" : "rgba(217,74,138,0.25)"}`,
      color: "white", fontWeight: 800, fontSize: size * 0.4,
      flexShrink: 0,
    }}>
      {letter}
    </div>
  );
};

/* ─── Podium Card (matching mockup) ─── */
const PodiumCard = ({ score, rank, isMale }: { score: any; rank: number; isMale: boolean }) => {
  const heights: Record<number, string> = { 1: "130px", 2: "100px", 3: "85px" };
  const avatarSizes: Record<number, number> = { 1: 80, 2: 65, 3: 65 };
  const rankColor = isMale ? "#4a7fbd" : "#bd4a7f";
  const delay = rank === 1 ? "0s" : rank === 2 ? "0.5s" : "1s";

  if (!score) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
        <div style={{ height: heights[rank], width: "100%", maxWidth: "145px", background: "rgba(0,0,0,0.03)", borderRadius: "10px 10px 0 0" }} />
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
      zIndex: rank === 1 ? 5 : 1,
      animation: `podiumFloat 4s ease-in-out ${delay} infinite`,
    }}>
      {/* Avatar */}
      <Avatar name={score.participants?.first_name || ""} gender={score.participants?.category || ""} size={avatarSizes[rank]} />

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: "145px", height: heights[rank], marginTop: "-12px",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        borderRadius: "10px 10px 4px 4px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "0.5rem",
        transform: "perspective(800px) rotateX(2deg)",
        transformOrigin: "bottom center",
        border: "1px solid rgba(255,255,255,0.7)",
      }}>
        <span style={{ fontSize: "1.5rem", fontWeight: 900, color: rankColor }}>{rank}</span>
        <span style={{
          fontSize: rank === 1 ? "0.9rem" : "0.82rem", fontWeight: 700, color: "#1e293b",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "125px", textAlign: "center",
        }}>
          {score.participants?.first_name} . {score.participants?.last_name?.charAt(0)}
        </span>
        <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#475569", marginTop: "2px" }}>
          {score.value}
        </span>
      </div>
    </div>
  );
};

/* ─── Leaderboard Column (mockup-faithful) ─── */
const LeaderboardColumn = ({ title, data, isMale }: { title: string; data: any[]; isMale: boolean }) => {
  const bgTint = isMale
    ? "linear-gradient(180deg, rgba(215,228,248,0.7) 0%, rgba(230,238,252,0.4) 100%)"
    : "linear-gradient(180deg, rgba(248,215,230,0.7) 0%, rgba(252,230,240,0.4) 100%)";
  const titleColor = isMale ? "#4a7fbd" : "#bd4a7f";
  const borderTint = isMale ? "rgba(74,127,189,0.12)" : "rgba(189,74,127,0.12)";

  return (
    <div style={{
      flex: 1, background: bgTint, borderRadius: "18px", padding: "1.8rem 1.5rem",
      display: "flex", flexDirection: "column",
      backdropFilter: "blur(12px)", border: `1px solid ${borderTint}`,
      boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
    }}>
      <h2 style={{ color: titleColor, fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem", fontStyle: "italic", margin: "0 0 1.5rem" }}>
        {title}
      </h2>

      {data.length === 0 ? (
        <p style={{ color: "#94a3b8", fontStyle: "italic", textAlign: "center", marginTop: "3rem" }}>
          Aucune performance enregistrée...
        </p>
      ) : (
        <>
          {/* ── Podium ── */}
          <div style={{
            display: "flex", alignItems: "flex-end", gap: "10px",
            marginBottom: "2rem", justifyContent: "center", minHeight: "210px",
          }}>
            <PodiumCard rank={2} score={data[1]} isMale={isMale} />
            <PodiumCard rank={1} score={data[0]} isMale={isMale} />
            <PodiumCard rank={3} score={data[2]} isMale={isMale} />
          </div>

          {/* ── Table 4-8 (mockup style: white card, clean rows) ── */}
          {data.length > 3 && (
            <div style={{
              background: "rgba(255,255,255,0.75)",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              border: "1px solid rgba(255,255,255,0.6)",
            }}>
              {/* Table Header */}
              <div style={{
                display: "flex", padding: "0.7rem 1.2rem",
                fontWeight: 700, fontSize: "0.75rem", color: "#64748b",
                textTransform: "uppercase", letterSpacing: "0.06em",
                borderBottom: `1px solid ${borderTint}`,
              }}>
                <span style={{ width: "50px" }}>Rank</span>
                <span style={{ flex: 1 }}>Athlete</span>
                <span style={{ width: "70px", textAlign: "right" }}>Points</span>
              </div>

              {/* Rows */}
              {data.slice(3, 8).map((score, idx) => (
                <div key={score.id} style={{
                  display: "flex", alignItems: "center",
                  padding: "0.8rem 1.2rem",
                  borderBottom: idx < Math.min(data.length - 4, 4) ? `1px solid rgba(0,0,0,0.04)` : "none",
                  background: idx % 2 === 0 ? "rgba(255,255,255,0.5)" : "transparent",
                }}>
                  <span style={{ width: "50px", fontWeight: 700, color: "#475569", fontSize: "0.95rem" }}>
                    {idx + 4}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong style={{ color: "#1e293b", fontSize: "0.95rem" }}>
                      {score.participants?.first_name} . {score.participants?.last_name?.charAt(0)}
                    </strong>
                  </span>
                  <span style={{ width: "70px", textAlign: "right", fontWeight: 800, color: "#475569", fontSize: "1rem" }}>
                    {score.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ─── Dynamic Geometric Background ─── */
const GeometricBackground = () => {
  const shapes = [
    // Large floating shapes
    { type: "circle", top: "5%", left: "8%", size: 90, color: "rgba(74,144,217,0.08)", dur: "14s", delay: "0s" },
    { type: "circle", top: "60%", left: "85%", size: 110, color: "rgba(200,100,150,0.07)", dur: "18s", delay: "1s" },
    { type: "circle", top: "40%", left: "50%", size: 140, color: "rgba(130,130,200,0.04)", dur: "22s", delay: "3s" },
    // Triangles
    { type: "triangle", top: "10%", left: "70%", size: 60, color: "rgba(139,92,246,0.08)", dur: "12s", delay: "0.5s" },
    { type: "triangle", top: "75%", left: "15%", size: 55, color: "rgba(74,127,189,0.07)", dur: "16s", delay: "2s" },
    { type: "triangle", top: "30%", left: "92%", size: 45, color: "rgba(200,130,160,0.06)", dur: "20s", delay: "4s" },
    { type: "triangle", top: "85%", left: "60%", size: 50, color: "rgba(100,180,220,0.06)", dur: "15s", delay: "1.5s" },
    // Squares / Diamonds
    { type: "diamond", top: "20%", left: "30%", size: 35, color: "rgba(180,120,200,0.07)", dur: "11s", delay: "0.8s" },
    { type: "diamond", top: "55%", left: "5%", size: 40, color: "rgba(100,160,220,0.06)", dur: "19s", delay: "2.5s" },
    { type: "diamond", top: "15%", left: "55%", size: 30, color: "rgba(220,100,130,0.05)", dur: "13s", delay: "3.5s" },
    // Small dots
    { type: "circle", top: "90%", left: "40%", size: 20, color: "rgba(74,144,217,0.1)", dur: "9s", delay: "0s" },
    { type: "circle", top: "3%", left: "40%", size: 25, color: "rgba(200,100,180,0.08)", dur: "10s", delay: "1s" },
    { type: "circle", top: "50%", left: "70%", size: 18, color: "rgba(100,200,150,0.08)", dur: "8s", delay: "2s" },
    { type: "circle", top: "70%", left: "35%", size: 22, color: "rgba(200,180,100,0.07)", dur: "11s", delay: "0.5s" },
    // Hexagons (approx with clip-path)
    { type: "hexagon", top: "45%", left: "20%", size: 50, color: "rgba(139,92,246,0.06)", dur: "17s", delay: "1.2s" },
    { type: "hexagon", top: "25%", left: "80%", size: 40, color: "rgba(74,200,180,0.05)", dur: "21s", delay: "3s" },
  ];

  return (
    <>
      {shapes.map((s, i) => {
        let borderRadius = "0";
        let clipPath: string | undefined;
        if (s.type === "circle") { borderRadius = "50%"; }
        else if (s.type === "triangle") { clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)"; }
        else if (s.type === "diamond") { clipPath = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"; }
        else if (s.type === "hexagon") { clipPath = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"; }

        return (
          <div key={i} style={{
            position: "absolute", top: s.top, left: s.left,
            width: s.size, height: s.size,
            background: s.color, borderRadius, clipPath,
            animation: `geoPath${i % 4} ${s.dur} ease-in-out ${s.delay} infinite`,
            pointerEvents: "none", zIndex: 0,
          }} />
        );
      })}
    </>
  );
};

/* ═══════════════════════════════════════
   Main Page
   ═══════════════════════════════════════ */
export default function Home() {
  const [scoresHommes, setScoresHommes] = useState<any[]>([]);
  const [scoresFemmes, setScoresFemmes] = useState<any[]>([]);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const now = new Date();
    setDateStr(now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }));

    const fetchScores = async () => {
      const { data } = await supabase
        .from("scores")
        .select(`
          id, value, recorded_at, participant_id,
          participants (id, first_name, last_name, category, age_category)
        `)
        .order("value", { ascending: false });

      if (data) {
        const bestMap = new Map();
        for (const s of data) {
          if (!bestMap.has(s.participant_id)) bestMap.set(s.participant_id, s);
        }
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
      {/* Dynamic Background */}
      <GeometricBackground />

      {/* Subtle animated gradient overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "linear-gradient(45deg, rgba(74,144,217,0.03) 0%, transparent 40%, rgba(217,74,138,0.03) 60%, transparent 100%)",
        animation: "gradientShift 8s ease-in-out infinite alternate",
      }} />

      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.2rem 2.5rem", position: "relative", zIndex: 10,
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        background: "rgba(255,255,255,0.4)",
        backdropFilter: "blur(20px)",
      }}>
        <h1 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#334155", margin: 0 }}>
          Classement Jump Contest
        </h1>
        <span style={{ fontSize: "0.95rem", color: "#94a3b8", fontWeight: 500 }}>
          {dateStr}
        </span>
      </header>

      {/* Content */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem",
        padding: "2rem 2.5rem", position: "relative", zIndex: 10,
        maxWidth: "1500px", margin: "0 auto",
      }}>
        <LeaderboardColumn title="Classement Masculin" data={scoresHommes} isMale={true} />
        <LeaderboardColumn title="Classement Féminin" data={scoresFemmes} isMale={false} />
      </div>

      {/* Admin link */}
      <div style={{ position: "fixed", bottom: "1rem", right: "1.5rem", zIndex: 20 }}>
        <Link href="/login" style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.12)", textDecoration: "none" }}>
          Accès Panel
        </Link>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes podiumFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes geoPath0 {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
          25%  { transform: translate(20px, -25px) rotate(45deg); opacity: 1; }
          50%  { transform: translate(-10px, -15px) rotate(90deg); opacity: 0.5; }
          75%  { transform: translate(15px, -30px) rotate(200deg); opacity: 0.9; }
          100% { transform: translate(0, 0) rotate(360deg); opacity: 0.7; }
        }
        @keyframes geoPath1 {
          0%   { transform: translate(0, 0) rotate(0deg) scale(1); }
          33%  { transform: translate(-18px, -20px) rotate(120deg) scale(1.15); }
          66%  { transform: translate(12px, -35px) rotate(240deg) scale(0.9); }
          100% { transform: translate(0, 0) rotate(360deg) scale(1); }
        }
        @keyframes geoPath2 {
          0%   { transform: translate(0, 0) rotate(0deg); }
          20%  { transform: translate(25px, -10px) rotate(72deg); }
          40%  { transform: translate(-5px, -30px) rotate(144deg); }
          60%  { transform: translate(-20px, -8px) rotate(216deg); }
          80%  { transform: translate(10px, -22px) rotate(288deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        @keyframes geoPath3 {
          0%   { transform: translate(0, 0) scale(1); opacity: 0.6; }
          50%  { transform: translate(-15px, -25px) scale(1.2); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
        }
        @keyframes gradientShift {
          0%   { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
