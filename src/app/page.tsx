"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const PodiumBlock = ({ rank, score, color, height }: { rank: number, score: any, color: string, height: string }) => {
  return (
    <div style={{
       display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
       flex: 1, zIndex: rank === 1 ? 5 : 1
    }}>
      {/* Detail inside podium above pillar */}
      {score ? (
        <div style={{ textAlign: 'center', marginBottom: '8px', padding: '0 4px' }}>
          <div style={{ fontSize: rank === 1 ? '1.1rem' : '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px', margin: '0 auto' }}>
             {score.participants?.first_name} {score.participants?.last_name?.charAt(0)}.
          </div>
          <div style={{ fontSize: rank === 1 ? '1.6rem' : '1.3rem', color: color, fontWeight: '900', textShadow: '0 0 10px rgba(0,0,0,0.5)', margin: '4px 0' }}>
             {score.value} <span style={{fontSize: '50%'}}>cm</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
             {score.participants?.age_category || 'U18'}
          </div>
        </div>
      ) : (
         <div style={{minHeight: '80px'}} /> // spacing for empty podiums
      )}
      
      {/* The 3D Block */}
      <div style={{
        height: height,
        width: '100%',
        maxWidth: '120px',
        background: `linear-gradient(180deg, ${color} 0%, rgba(0,0,0,0.6) 100%)`,
        borderTop: `4px solid ${color}`,
        borderRadius: '8px 8px 0 0',
        boxShadow: `inset 0 10px 20px -10px rgba(255,255,255,0.5), 0 -5px 25px -5px ${color}`,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '0.5rem',
        opacity: score ? 1 : 0.4
      }}>
         <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.8)', textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>{rank}</span>
      </div>
    </div>
  )
};

const LeaderboardColumn = ({ title, data }: { title: string, data: any[] }) => {
  return (
    <div style={{ flex: 1, background: "rgba(0,0,0,0.25)", borderRadius: "16px", padding: "2rem", minHeight: "300px", display: "flex", flexDirection: "column" }}>
      <h2 style={{ textAlign: "center", color: "white", marginBottom: "2.5rem", fontSize: "1.8rem", fontWeight: "bold", borderBottom: "2px solid rgba(255,255,255,0.1)", paddingBottom: "1.5rem" }}>
        {title}
      </h2>
      
      {data.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.4)", fontStyle: "italic", textAlign: "center", marginTop: "2rem" }}>
          Aucune performance...
        </p>
      ) : (
        <>
          {/* Podium for top 3 */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '240px', gap: '10px', marginBottom: '3rem', justifyContent: 'center' }}>
            {/* Rank 2 */}
            <PodiumBlock rank={2} score={data[1]} color="#cbd5e1" height="120px" />
            {/* Rank 1 */}
            <PodiumBlock rank={1} score={data[0]} color="#fbbf24" height="160px" />
            {/* Rank 3 */}
            <PodiumBlock rank={3} score={data[2]} color="#b45309" height="90px" />
          </div>

          {/* List for Rest of the Top 10 */}
          {data.length > 3 && (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, textAlign: "left" }}>
              {data.slice(3, 10).map((score, index) => {
                const rank = index + 4;
                return (
                  <li key={score.id} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    padding: "1rem", 
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "8px",
                    marginBottom: "0.5rem",
                    alignItems: "center"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ 
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: "30px", height: "30px", borderRadius: "50%", 
                        background: "rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.8)", fontWeight: "bold", fontSize: "0.9rem"
                      }}>
                        {rank}
                      </span>
                      <div>
                        <strong style={{ fontSize: "1rem", display: "block", color: "white" }}>
                          {score.participants?.first_name} {score.participants?.last_name?.toUpperCase()}
                        </strong>
                        <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                          {score.participants?.age_category || 'U18'}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#818cf8" }}>
                      {score.value} <span style={{fontSize:"60%"}}>cm</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default function Home() {
  const [scoresHommes, setScoresHommes] = useState<any[]>([]);
  const [scoresFemmes, setScoresFemmes] = useState<any[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      const { data } = await supabase
        .from("scores")
        .select(`
          id, value, recorded_at, participant_id,
          participants (id, first_name, last_name, category, age_category)
        `)
        .order("value", { ascending: false });
        
      if (data) {
        // Obtenir la meilleure performance par athlète
        const bestScoresMap = new Map();
        for (const score of data) {
          if (!bestScoresMap.has(score.participant_id)) {
            bestScoresMap.set(score.participant_id, score);
          }
        }
        
        const allBestScores = Array.from(bestScoresMap.values());
        
        // Séparer et limiter à Top 10
        const hommes = allBestScores.filter(s => s.participants?.category === 'Homme' || s.participants?.category === 'H').slice(0, 10);
        const femmes = allBestScores.filter(s => s.participants?.category === 'Femme' || s.participants?.category === 'F').slice(0, 10);
        
        setScoresHommes(hommes);
        setScoresFemmes(femmes);
      }
    };

    fetchScores();

    // Abonnement temps réel
    const channel = supabase.channel("realtime-scores")
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, () => {
        fetchScores();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        minHeight: "100vh",
        margin: 0,
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        overflowX: "hidden",
        position: "relative",
        padding: "3rem 2rem",
        paddingBottom: "10rem"
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-120px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "-80px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ textAlign: "center", marginBottom: "4rem", zIndex: 10 }}>
        {/* Status badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "100px",
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            marginBottom: "1.5rem",
            fontSize: "0.85rem",
            color: "#4ade80",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#4ade80",
              display: "inline-block",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          Live Realtime Data
        </div>

        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 800,
            margin: "0 0 0.5rem 0",
            background: "linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 50%, #818cf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          Classement Général
        </h1>

        <p
          style={{
            fontSize: "1.15rem",
            color: "rgba(255, 255, 255, 0.55)",
            margin: "0",
            fontWeight: 400,
            letterSpacing: "0.01em",
          }}
        >
          LiveBoard - Championnat de Saut BPJEPS
        </p>
      </div>

      {/* Grid Hommes & Femmes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "3rem",
          width: "100%",
          maxWidth: "1400px",
          zIndex: 10
        }}
      >
        <LeaderboardColumn title="Côté Hommes" data={scoresHommes} />
        <LeaderboardColumn title="Côté Femmes" data={scoresFemmes} />
      </div>

      {/* Bouton discret Panel Admin */}
      <div style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "2rem",
          zIndex: 20
      }}>
        <Link href="/login" style={{
          fontSize: "0.85rem",
          color: "rgba(255, 255, 255, 0.25)",
          textDecoration: "none",
          transition: "all 0.2s"
        }}>
          Accès Panel
        </Link>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </main>
  );
}
