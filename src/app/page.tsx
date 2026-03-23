"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/* ─── Avatar (initials) ─── */
const Avatar = ({ name, gender, size = "4vw" }: { name: string; gender: string; size?: string }) => {
  const letter = name?.charAt(0)?.toUpperCase() || "?";
  const isMale = gender === "Homme" || gender === "H";
  const bg = !name
    ? "rgba(0,0,0,0.05)" // Placeholder
    : isMale ? "linear-gradient(135deg, #4a90d9, #357abd)" : "linear-gradient(135deg, #d94a8a, #bd357a)";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg,
      border: `max(2px, 0.2vw) solid ${!name ? "transparent" : isMale ? "#5b9bd5" : "#d55b9b"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: !name ? "none" : `0 4px 15px rgba(0,0,0,0.2), 0 0 20px ${isMale ? "rgba(74,144,217,0.25)" : "rgba(217,74,138,0.25)"}`,
      color: !name ? "transparent" : "white", fontWeight: 800, fontSize: `calc(${size} * 0.45)`, flexShrink: 0,
    }}>
      {letter}
    </div>
  );
};

/* ─── Podium Card ─── */
const PodiumCard = ({ score, rank, isMale }: { score: any; rank: number; isMale: boolean }) => {
  const heights: Record<number, string> = { 1: "26vh", 2: "20vh", 3: "16vh" }; // Taller podiums
  const avatarSizes: Record<number, string> = { 1: "11vh", 2: "9vh", 3: "9vh" }; // Larger avatars
  const rankColor = isMale ? "#4a7fbd" : "#bd4a7f";
  const delay = rank === 1 ? "0s" : rank === 2 ? "0.5s" : "1s";

  if (!score) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
        <div style={{ height: heights[rank], width: "100%", maxWidth: "15vw", background: "rgba(0,0,0,0.03)", borderRadius: "10px 10px 0 0" }} />
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
        width: "100%", maxWidth: "16vw", height: heights[rank], marginTop: "-1.5vh",
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)",
        borderRadius: "1vw 1vw 0.5vw 0.5vw",
        boxShadow: "0 1vh 3vh rgba(0,0,0,0.08)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1vh",
        transform: "perspective(800px) rotateX(2deg)", transformOrigin: "bottom center",
        border: "1px solid rgba(255,255,255,0.7)",
      }}>
        {/* Even larger font sizes for the podium */}
        <span style={{ fontSize: "clamp(2.5rem, 4vw, 5rem)", fontWeight: 900, color: rankColor, lineHeight: 1 }}>{rank}</span>
        <span style={{
          fontSize: "clamp(1.2rem, 1.8vw, 2.5rem)", fontWeight: 800, color: "#1e293b",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "95%", textAlign: "center",
          lineHeight: 1.2, marginTop: "1vh"
        }}>
          {score.participants?.first_name} . {score.participants?.last_name?.charAt(0)}
        </span>
        <span style={{ fontSize: "clamp(1.4rem, 2vw, 3rem)", fontWeight: 900, color: "#475569", marginTop: "1vh" }}>
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
  const borderTint = isMale ? "rgba(74,127,189,0.15)" : "rgba(189,74,127,0.15)";

  // Prepare 5 slots for ranks 4-8. Fill missing slots with null.
  const ranks4to8 = [];
  for (let i = 0; i < 5; i++) {
    const scoreIdx = i + 3; // data[3] = rank 4
    if (data[scoreIdx]) {
      ranks4to8.push(data[scoreIdx]);
    } else {
      ranks4to8.push(null);
    }
  }

  return (
    <div style={{
      flex: 1, background: bgTint, borderRadius: "2vw", padding: "2vw 2.5vw",
      display: "flex", flexDirection: "column",
      backdropFilter: "blur(12px)", border: `max(1px, 0.1vw) solid ${borderTint}`,
      boxShadow: "0 1vh 4vh rgba(0,0,0,0.05)",
      height: "100%", /* Stretch to fill the grid */
    }}>
      <h2 style={{ color: titleColor, fontSize: "clamp(1.8rem, 2.5vw, 3.5rem)", fontWeight: 800, fontStyle: "italic", margin: "0 0 2vh" }}>
        {title}
      </h2>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Podium */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1.5vw", marginBottom: "3vh", justifyContent: "center", minHeight: "33vh" }}>
          <PodiumCard rank={2} score={data[1]} isMale={isMale} />
          <PodiumCard rank={1} score={data[0]} isMale={isMale} />
          <PodiumCard rank={3} score={data[2]} isMale={isMale} />
        </div>

        {/* Ranks 4-8 Card */ /* Using flex: 1 to make the list stretch nicely downward */}
        <div style={{
          background: "rgba(255,255,255,0.85)", borderRadius: "1.2vw",
          overflow: "hidden", boxShadow: "0 0.5vh 2vh rgba(0,0,0,0.05)",
          border: "1px solid rgba(255,255,255,0.8)",
          display: "flex", flexDirection: "column",
          flex: 1,
        }}>
          {/* Header */}
          <div style={{
            display: "flex", padding: "1.2vh 1.5vw",
            fontWeight: 800, fontSize: "clamp(0.9rem, 1.2vw, 1.8rem)", color: "#64748b",
            textTransform: "uppercase", letterSpacing: "0.08em",
            borderBottom: `max(1px, 0.1vw) solid ${borderTint}`,
          }}>
            <span style={{ width: "12%" }}>Rang</span>
            <span style={{ flex: 1 }}>Athlete</span>
            <span style={{ width: "15%", textAlign: "right" }}>Points</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {ranks4to8.map((score, idx) => {
              const rankNum = idx + 4;
              return (
                <div key={score ? score.id : `empty-${idx}`} style={{
                  display: "flex", alignItems: "center",
                  flex: 1, /* Stretch to divide space equally */
                  padding: "0.5vh 1.5vw",
                  borderBottom: idx < 4 ? "1px solid rgba(0,0,0,0.04)" : "none",
                  background: idx % 2 === 0 ? "rgba(255,255,255,0.5)" : "transparent",
                }}>
                  <span style={{ width: "12%", fontWeight: 800, color: "#475569", fontSize: "clamp(1.2rem, 1.8vw, 2.5rem)" }}>
                    {rankNum}
                  </span>
                  <span style={{ flex: 1, display: "flex", alignItems: "center", gap: "1vw" }}>
                    <Avatar name={score?.participants?.first_name || ""} gender={score?.participants?.category || ""} size="3.5vw" />
                    
                    {score ? (
                      <strong style={{ color: "#1e293b", fontSize: "clamp(1.1rem, 1.6vw, 2.4rem)", fontWeight: 800 }}>
                        {score.participants?.first_name} . {score.participants?.last_name?.charAt(0)}
                      </strong>
                    ) : (
                      <strong style={{ background: "rgba(0,0,0,0.03)", borderRadius: "6px", width: "40%", height: "clamp(1.1rem, 1.6vw, 2.4rem)" }} />
                    )}
                  </span>
                  
                  {score ? (
                    <span style={{ width: "15%", textAlign: "right", fontWeight: 900, color: "#475569", fontSize: "clamp(1.3rem, 1.8vw, 2.8rem)" }}>
                      {score.value}
                    </span>
                  ) : (
                    <span style={{ width: "15%", textAlign: "right", fontWeight: 900, color: "rgba(0,0,0,0.05)", fontSize: "clamp(1.3rem, 1.8vw, 2.8rem)" }}>
                      -
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Dense Dynamic Background ─── */
const GeometricBackground = () => {
  const shapes = [
    // Large orbs
    { type: "circle", top: "3%", left: "6%", size: "10vw", color: "rgba(74,144,217,0.08)", dur: "13s", delay: "0s" },
    { type: "circle", top: "55%", left: "88%", size: "12vw", color: "rgba(217,74,138,0.07)", dur: "17s", delay: "1s" },
    { type: "circle", top: "35%", left: "48%", size: "15vw", color: "rgba(130,130,200,0.04)", dur: "21s", delay: "2.5s" },
    { type: "circle", top: "80%", left: "30%", size: "8vw", color: "rgba(100,200,180,0.06)", dur: "15s", delay: "0.5s" },
    // Triangles
    { type: "triangle", top: "8%", left: "72%", size: "6vw", color: "rgba(139,92,246,0.09)", dur: "11s", delay: "0.3s" },
    { type: "triangle", top: "70%", left: "12%", size: "5.5vw", color: "rgba(74,127,189,0.08)", dur: "14s", delay: "1.8s" },
    { type: "triangle", top: "28%", left: "94%", size: "5vw", color: "rgba(200,130,160,0.07)", dur: "18s", delay: "3.5s" },
    { type: "triangle", top: "88%", left: "58%", size: "5.5vw", color: "rgba(100,180,220,0.07)", dur: "13s", delay: "1.2s" },
    { type: "triangle", top: "50%", left: "3%", size: "4.5vw", color: "rgba(200,160,80,0.06)", dur: "16s", delay: "2s" },
    // Diamonds
    { type: "diamond", top: "18%", left: "28%", size: "4vw", color: "rgba(180,120,200,0.08)", dur: "10s", delay: "0.7s" },
    { type: "diamond", top: "60%", left: "4%", size: "4.5vw", color: "rgba(100,160,220,0.07)", dur: "19s", delay: "2.2s" },
    { type: "diamond", top: "12%", left: "52%", size: "3.5vw", color: "rgba(220,100,130,0.06)", dur: "12s", delay: "3s" },
    { type: "diamond", top: "75%", left: "70%", size: "5vw", color: "rgba(74,200,150,0.06)", dur: "15s", delay: "0.8s" },
    // Hexagons
    { type: "hexagon", top: "42%", left: "18%", size: "5.5vw", color: "rgba(139,92,246,0.07)", dur: "16s", delay: "1s" },
    { type: "hexagon", top: "22%", left: "82%", size: "4.5vw", color: "rgba(74,200,180,0.06)", dur: "20s", delay: "2.8s" },
    { type: "hexagon", top: "90%", left: "85%", size: "4vw", color: "rgba(200,100,100,0.05)", dur: "14s", delay: "0.4s" },
    // Small floating dots
    { type: "circle", top: "92%", left: "38%", size: "2.2vw", color: "rgba(74,144,217,0.1)", dur: "8s", delay: "0s" },
    { type: "circle", top: "2%", left: "38%", size: "2.8vw", color: "rgba(200,100,180,0.09)", dur: "9s", delay: "0.8s" },
    { type: "circle", top: "48%", left: "68%", size: "2vw", color: "rgba(100,200,150,0.09)", dur: "7s", delay: "1.5s" },
    { type: "circle", top: "65%", left: "42%", size: "2.5vw", color: "rgba(200,180,100,0.08)", dur: "10s", delay: "0.3s" },
    { type: "circle", top: "15%", left: "15%", size: "1.8vw", color: "rgba(74,127,189,0.1)", dur: "9s", delay: "2s" },
    { type: "circle", top: "38%", left: "78%", size: "1.5vw", color: "rgba(217,74,138,0.09)", dur: "8s", delay: "1.2s" },
    { type: "circle", top: "82%", left: "52%", size: "1.6vw", color: "rgba(139,92,246,0.08)", dur: "11s", delay: "0.6s" },
    { type: "circle", top: "55%", left: "25%", size: "2vw", color: "rgba(100,180,220,0.08)", dur: "10s", delay: "3s" },
    // Extra medium shapes for density
    { type: "triangle", top: "45%", left: "40%", size: "3.5vw", color: "rgba(180,140,200,0.05)", dur: "22s", delay: "4s" },
    { type: "diamond", top: "5%", left: "60%", size: "3vw", color: "rgba(74,144,217,0.06)", dur: "13s", delay: "1.5s" },
    { type: "hexagon", top: "68%", left: "50%", size: "3.8vw", color: "rgba(200,130,100,0.05)", dur: "18s", delay: "2.5s" },
    { type: "triangle", top: "95%", left: "20%", size: "4.2vw", color: "rgba(100,140,200,0.06)", dur: "15s", delay: "0.5s" },
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
      height: "100vh", width: "100vw", margin: 0, position: "relative", overflow: "hidden",
      background: "linear-gradient(160deg, #edf1f7 0%, #e4e8f0 30%, #f2e8ee 70%, #edf1f7 100%)",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      color: "#1e293b", padding: 0,
      display: "flex", flexDirection: "column",
    }}>
      <GeometricBackground />

      {/* Pulsating gradient overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 20% 30%, rgba(74,144,217,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(217,74,138,0.05) 0%, transparent 60%)",
        animation: "pulseOverlay 6s ease-in-out infinite alternate",
      }} />

      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.5vh 3vw", flexShrink: 0,
        position: "relative", zIndex: 10,
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        background: "rgba(255,255,255,0.4)", backdropFilter: "blur(20px)",
      }}>
        <h1 style={{ fontSize: "clamp(1.5rem, 2.2vw, 3rem)", fontWeight: 800, color: "#334155", margin: 0, letterSpacing: "-0.02em" }}>
          Classement Jump Contest
        </h1>
        <span style={{ fontSize: "clamp(1.2rem, 1.8vw, 2.5rem)", color: "#94a3b8", fontWeight: 700 }}>
          {dateStr}
        </span>
      </header>

      {/* Content — Fill the remaining space completely */}
      <div style={{
        flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "3vw", padding: "3vh 3vw",
        position: "relative", zIndex: 10,
        alignItems: "stretch", /* Ensure columns stretch to fill vertically */
      }}>
        <LeaderboardColumn title="Classement Masculin" data={scoresHommes} isMale={true} />
        <LeaderboardColumn title="Classement Féminin" data={scoresFemmes} isMale={false} />
      </div>

      {/* Admin link */}
      <div style={{ position: "fixed", bottom: "1vh", right: "1vw", zIndex: 20 }}>
        <Link href="/login" style={{ fontSize: "clamp(0.8rem, 1vw, 1.4rem)", color: "rgba(0,0,0,0.12)", textDecoration: "none" }}>
          Accès Panel
        </Link>
      </div>

      <style>{`
        @keyframes podiumFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5vh); }
        }
        @keyframes geo0 {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 0.6; }
          25%  { transform: translate(2vw, -3vh) rotate(50deg); opacity: 1; }
          50%  { transform: translate(-1vw, -2vh) rotate(110deg); opacity: 0.4; }
          75%  { transform: translate(1.5vw, -4vh) rotate(220deg); opacity: 0.9; }
          100% { transform: translate(0, 0) rotate(360deg); opacity: 0.6; }
        }
        @keyframes geo1 {
          0%   { transform: translate(0, 0) rotate(0deg) scale(1); }
          33%  { transform: translate(-2vw, -3vh) rotate(130deg) scale(1.18); }
          66%  { transform: translate(1.5vw, -4vh) rotate(250deg) scale(0.88); }
          100% { transform: translate(0, 0) rotate(360deg) scale(1); }
        }
        @keyframes geo2 {
          0%   { transform: translate(0, 0) rotate(0deg); }
          20%  { transform: translate(3vw, -1.5vh) rotate(75deg); }
          40%  { transform: translate(-1vw, -4vh) rotate(150deg); }
          60%  { transform: translate(-2.5vw, -1.5vh) rotate(225deg); }
          80%  { transform: translate(1.5vw, -3vh) rotate(300deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        @keyframes geo3 {
          0%   { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50%  { transform: translate(-2vw, -3.5vh) scale(1.25); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
        }
        @keyframes geo4 {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
          30%  { transform: translate(1.5vw, -3vh) rotate(100deg); opacity: 0.4; }
          60%  { transform: translate(-2vw, -2vh) rotate(200deg); opacity: 1; }
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
