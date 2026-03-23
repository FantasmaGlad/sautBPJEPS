"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/* ─── Avatar Component ─── */
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
      boxShadow: `0 4px 15px rgba(0,0,0,0.25), 0 0 20px ${isMale ? "rgba(74,144,217,0.3)" : "rgba(217,74,138,0.3)"}`,
      color: "white", fontWeight: 800, fontSize: size * 0.4,
      flexShrink: 0,
    }}>
      {letter}
    </div>
  );
};

/* ─── Podium Card ─── */
const PodiumCard = ({ score, rank, isMale }: { score: any; rank: number; isMale: boolean }) => {
  const heights: Record<number, string> = { 1: "140px", 2: "110px", 3: "90px" };
  const avatarSizes: Record<number, number> = { 1: 80, 2: 65, 3: 65 };
  const rankColor = isMale ? "#4a7fbd" : "#bd4a7f";
  const delay = rank === 1 ? "0s" : rank === 2 ? "0.4s" : "0.8s";

  if (!score) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
        <div style={{ height: heights[rank], width: "100%", maxWidth: "140px", background: "rgba(0,0,0,0.04)", borderRadius: "12px 12px 0 0" }} />
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
      zIndex: rank === 1 ? 5 : 1,
      animation: `podiumFloat 3s ease-in-out ${delay} infinite`,
    }}>
      {/* Avatar circle */}
      <Avatar
        name={score.participants?.first_name || ""}
        gender={score.participants?.category || ""}
        size={avatarSizes[rank]}
      />

      {/* Card block */}
      <div style={{
        width: "100%", maxWidth: "140px", height: heights[rank], marginTop: "-10px",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px)",
        borderRadius: "12px 12px 4px 4px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "0.5rem",
        transform: "perspective(600px) rotateX(2deg)",
        transformOrigin: "bottom center",
        border: "1px solid rgba(255,255,255,0.6)",
      }}>
        <span style={{ fontSize: "1.6rem", fontWeight: 900, color: rankColor }}>{rank}</span>
        <span style={{
          fontSize: rank === 1 ? "0.95rem" : "0.85rem", fontWeight: 700, color: "#1e293b",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px", textAlign: "center"
        }}>
          {score.participants?.first_name} . {score.participants?.last_name?.charAt(0)}
        </span>
        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#475569", marginTop: "2px" }}>
          {score.value}
        </span>
      </div>
    </div>
  );
};

/* ─── Leaderboard Column ─── */
const LeaderboardColumn = ({ title, data, isMale }: { title: string; data: any[]; isMale: boolean }) => {
  const bgTint = isMale
    ? "linear-gradient(180deg, rgba(210,225,245,0.6) 0%, rgba(230,238,250,0.3) 100%)"
    : "linear-gradient(180deg, rgba(245,210,225,0.6) 0%, rgba(250,230,238,0.3) 100%)";
  const titleColor = isMale ? "#4a7fbd" : "#bd4a7f";
  const headerBg = isMale ? "rgba(74,127,189,0.08)" : "rgba(189,74,127,0.08)";

  return (
    <div style={{
      flex: 1, background: bgTint, borderRadius: "20px", padding: "2rem 1.5rem",
      minHeight: "400px", display: "flex", flexDirection: "column",
      backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.4)",
      boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
    }}>
      <h2 style={{ color: titleColor, fontSize: "1.25rem", fontWeight: 700, marginBottom: "2rem", fontStyle: "italic" }}>
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
            display: "flex", alignItems: "flex-end", gap: "12px",
            marginBottom: "2.5rem", justifyContent: "center", minHeight: "220px",
          }}>
            <PodiumCard rank={2} score={data[1]} isMale={isMale} />
            <PodiumCard rank={1} score={data[0]} isMale={isMale} />
            <PodiumCard rank={3} score={data[2]} isMale={isMale} />
          </div>

          {/* ── Table Ranks 4+ ── */}
          {data.length > 3 && (
            <div>
              <div style={{
                display: "flex", padding: "0.6rem 1rem", fontWeight: 700, fontSize: "0.8rem",
                color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em",
                borderBottom: `2px solid ${isMale ? "rgba(74,127,189,0.15)" : "rgba(189,74,127,0.15)"}`,
              }}>
                <span style={{ width: "50px" }}>Rank</span>
                <span style={{ flex: 1 }}>Athlète</span>
                <span style={{ width: "80px", textAlign: "right" }}>Points</span>
              </div>
              {data.slice(3, 10).map((score, idx) => (
                <div key={score.id} style={{
                  display: "flex", alignItems: "center", padding: "0.75rem 1rem",
                  background: idx % 2 === 0 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)",
                  borderRadius: "6px", marginTop: "4px",
                }}>
                  <span style={{ width: "50px", fontWeight: 700, color: "#475569", fontSize: "0.95rem" }}>{idx + 4}</span>
                  <span style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Avatar name={score.participants?.first_name || ""} gender={score.participants?.category || ""} size={32} />
                    <strong style={{ color: "#1e293b", fontSize: "0.95rem" }}>
                      {score.participants?.first_name} . {score.participants?.last_name?.charAt(0)}
                    </strong>
                  </span>
                  <span style={{ width: "80px", textAlign: "right", fontWeight: 800, color: "#475569", fontSize: "1rem" }}>
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

/* ─── Geometric Background Shapes ─── */
const GeometricBackground = () => {
  const shapes = [
    { type: "triangle", top: "8%", left: "5%", size: 60, rotation: 15, delay: "0s", dur: "18s", color: "rgba(100,140,200,0.07)" },
    { type: "circle", top: "15%", left: "85%", size: 90, rotation: 0, delay: "2s", dur: "22s", color: "rgba(200,100,150,0.06)" },
    { type: "square", top: "70%", left: "10%", size: 50, rotation: 45, delay: "4s", dur: "20s", color: "rgba(100,140,200,0.05)" },
    { type: "triangle", top: "80%", left: "80%", size: 70, rotation: 200, delay: "1s", dur: "25s", color: "rgba(200,100,150,0.06)" },
    { type: "circle", top: "45%", left: "50%", size: 120, rotation: 0, delay: "3s", dur: "30s", color: "rgba(130,130,200,0.04)" },
    { type: "square", top: "25%", left: "70%", size: 40, rotation: 20, delay: "5s", dur: "16s", color: "rgba(180,120,160,0.05)" },
    { type: "triangle", top: "55%", left: "25%", size: 55, rotation: 120, delay: "2.5s", dur: "21s", color: "rgba(110,150,210,0.06)" },
    { type: "circle", top: "5%", left: "45%", size: 35, rotation: 0, delay: "1.5s", dur: "19s", color: "rgba(160,100,180,0.05)" },
    { type: "square", top: "90%", left: "55%", size: 45, rotation: 60, delay: "0.5s", dur: "24s", color: "rgba(120,160,200,0.05)" },
    { type: "triangle", top: "35%", left: "92%", size: 48, rotation: 280, delay: "3.5s", dur: "17s", color: "rgba(200,130,160,0.05)" },
  ];

  return (
    <>
      {shapes.map((s, i) => {
        const borderRadius = s.type === "circle" ? "50%" : s.type === "square" ? "4px" : "0";
        const clipPath = s.type === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : undefined;
        return (
          <div key={i} style={{
            position: "absolute", top: s.top, left: s.left,
            width: s.size, height: s.size,
            background: s.color, borderRadius, clipPath,
            transform: `rotate(${s.rotation}deg)`,
            animation: `geoFloat ${s.dur} ease-in-out ${s.delay} infinite, geoRotate ${s.dur} linear ${s.delay} infinite`,
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
        setScoresHommes(all.filter(s => s.participants?.category === "Homme" || s.participants?.category === "H").slice(0, 10));
        setScoresFemmes(all.filter(s => s.participants?.category === "Femme" || s.participants?.category === "F").slice(0, 10));
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
      background: "linear-gradient(160deg, #f0f4f8 0%, #e8ecf2 40%, #f5eef2 100%)",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      color: "#1e293b", padding: "0",
    }}>
      {/* Animated Geometric Background */}
      <GeometricBackground />

      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.2rem 2.5rem", position: "relative", zIndex: 10,
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        <h1 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#334155", margin: 0, letterSpacing: "-0.01em" }}>
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

      {/* Admin access */}
      <div style={{ position: "fixed", bottom: "1rem", right: "1.5rem", zIndex: 20 }}>
        <Link href="/login" style={{
          fontSize: "0.8rem", color: "rgba(0,0,0,0.15)", textDecoration: "none",
        }}>
          Accès Panel
        </Link>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes podiumFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes geoFloat {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-15px) translateX(8px); }
          50% { transform: translateY(-5px) translateX(-6px); }
          75% { transform: translateY(-20px) translateX(4px); }
        }
        @keyframes geoRotate {
          0% { rotate: 0deg; }
          100% { rotate: 360deg; }
        }
      `}</style>
    </main>
  );
}
