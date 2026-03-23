"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [scores, setScores] = useState<any[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      const { data } = await supabase
        .from("scores")
        .select(`
          id, value, recorded_at, age_category, participant_id,
          participants (id, first_name, last_name, category)
        `)
        .order("value", { ascending: false });
        
      if (data) {
        const bestScoresMap = new Map();
        for (const score of data) {
          if (!bestScoresMap.has(score.participant_id)) {
            bestScoresMap.set(score.participant_id, score);
          }
        }
        const topScores = Array.from(bestScoresMap.values()).slice(0, 5);
        setScores(topScores);
      }
    };

    fetchScores();

    // Abonnement temps réel simple pour mettre à jour la vue TV automatiquement
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
        justifyContent: "center",
        minHeight: "100vh",
        margin: 0,
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        overflow: "hidden",
        position: "relative",
        padding: "2rem"
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
          bottom: "-80px",
          left: "-80px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Card Principale (LiveBoard) */}
      <div
        style={{
          position: "relative",
          padding: "3rem 4rem",
          borderRadius: "24px",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          textAlign: "center",
          maxWidth: "800px",
          width: "100%",
          zIndex: 10
        }}
      >
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
          LiveBoard
        </h1>

        <p
          style={{
            fontSize: "1.15rem",
            color: "rgba(255, 255, 255, 0.55)",
            margin: "0 0 2rem 0",
            fontWeight: 400,
            letterSpacing: "0.01em",
          }}
        >
          Classement Provisoire — BPJEPS
        </p>

        {/* Tableau des Scores */}
        <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: "16px", padding: "1.5rem", marginTop: "2rem", minHeight: "150px" }}>
          {scores.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontStyle: "italic", margin: "2rem 0" }}>
              En attente des premières performances...
            </p>
          ) : (
             <ul style={{ listStyle: "none", padding: 0, margin: 0, textAlign: "left" }}>
              {scores.map((score, index) => (
                <li key={score.id} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  padding: "1rem", 
                  borderBottom: index === scores.length - 1 ? "none" : "1px solid rgba(255,255,255,0.1)",
                  alignItems: "center"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "36px", height: "36px", borderRadius: "50%", 
                      background: index === 0 ? "linear-gradient(135deg, #fbbf24, #d97706)" : index === 1 ? "linear-gradient(135deg, #cbd5e1, #64748b)" : index === 2 ? "linear-gradient(135deg, #b45309, #78350f)" : "rgba(255,255,255,0.1)",
                      color: "white", fontWeight: "bold", fontSize: "1.1rem"
                    }}>
                      {index + 1}
                    </span>
                    <div>
                      <strong style={{ fontSize: "1.15rem", display: "block", color: "white" }}>
                        {score.participants?.first_name} {score.participants?.last_name?.toUpperCase()}
                      </strong>
                      <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                        {score.participants?.category === 'H' ? 'Homme' : score.participants?.category === 'F' ? 'Femme' : score.participants?.category} • {score.age_category}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#818cf8", textShadow: "0 2px 10px rgba(129, 140, 248, 0.3)" }}>
                    {score.value} cm
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bouton discret Panel Admin */}
      <div style={{
          position: "absolute",
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
