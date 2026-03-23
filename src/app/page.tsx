"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // === SPONSOR CAROUSEL STATE ===
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  
  // Timer state
  const [displayMode, setDisplayMode] = useState<'leaderboard' | 'carousel'>('leaderboard');
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState<number>(0);
  const [isSponsorVisible, setIsSponsorVisible] = useState(false);

  useEffect(() => {
    fetchData();
    fetchSponsorsAndSettings();

    const channel = supabase
      .channel("public-db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "sponsors" }, fetchSponsorsAndSettings)
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, fetchSponsorsAndSettings)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const [pRes, sRes] = await Promise.all([
      supabase.from("participants").select("*"),
      supabase.from("scores").select("*, participants(*)").eq("is_active", true),
    ]);
    if (pRes.data) setParticipants(pRes.data);
    if (sRes.data) setScores(sRes.data);
    setLoading(false);
  };

  const fetchSponsorsAndSettings = async () => {
    const [spRes, setRes] = await Promise.all([
      supabase.from("sponsors").select("*").eq("is_active", true).order("display_order", { ascending: true }),
      supabase.from("settings").select("*").limit(1).single()
    ]);
    if (spRes.data) setSponsors(spRes.data);
    if (setRes.data) setGlobalSettings(setRes.data);
  };

  // === CAROUSEL TIMER ENGINE ===
  useEffect(() => {
    if (sponsors.length === 0 || !globalSettings) return;
    
    // Convert to milliseconds
    const leaderboardDurationMs = (globalSettings.carousel_interval_min || 3) * 60 * 1000;
    const breakDelayMs = (globalSettings.carousel_duration_sec || 1) * 1000;
    
    if (displayMode === 'leaderboard') {
      const t = setTimeout(() => {
         setDisplayMode('carousel');
         setCurrentSponsorIndex(0);
         setIsSponsorVisible(true);
      }, leaderboardDurationMs);
      return () => clearTimeout(t);
    }
    
    if (displayMode === 'carousel') {
      if (!isSponsorVisible) {
        // We are in the "delay between sponsors" (black screen transition)
        const t = setTimeout(() => {
           const nextIdx = currentSponsorIndex + 1;
           if (nextIdx >= sponsors.length) {
              setDisplayMode('leaderboard');
           } else {
              setCurrentSponsorIndex(nextIdx);
              setIsSponsorVisible(true);
           }
        }, breakDelayMs);
        return () => clearTimeout(t);
      } else {
        // Sponsor is currently visible
        const sponsor = sponsors[currentSponsorIndex];
        const sponsorDurationMs = (sponsor?.duration_sec || 5) * 1000;
        const t = setTimeout(() => {
           setIsSponsorVisible(false); // Hide image, triggering breakDelayMs next
        }, sponsorDurationMs);
        return () => clearTimeout(t);
      }
    }
  }, [displayMode, isSponsorVisible, currentSponsorIndex, sponsors, globalSettings]);


  const getBestScoresByGender = (gender: string) => {
    const bestScores: { [key: string]: any } = {};
    const genderScores = scores.filter((s) => s.participants?.category === gender || s.participants?.category === (gender === 'Homme' ? 'H' : 'F'));

    genderScores.forEach((score) => {
      const pid = score.participant_id;
      if (!bestScores[pid] || score.value > bestScores[pid].value) {
        bestScores[pid] = score;
      }
    });

    return Object.values(bestScores).sort((a: any, b: any) => b.value - a.value);
  };

  const topHommes = getBestScoresByGender("Homme");
  const topFemmes = getBestScoresByGender("Femme");

  /* === Avatars === */
  const Avatar = ({ name, gender, size = 6, showLetter = true }: { name?: string; gender: string; size?: number; showLetter?: boolean }) => {
    const isMale = gender === "Homme" || gender === "H";
    const letter = name && name.length > 0 ? name.charAt(0).toUpperCase() : "";
    return (
      <div style={{
        width: `${size}vw`, height: `${size}vw`, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isMale ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "linear-gradient(135deg, #ec4899, #db2777)",
        color: "white", fontWeight: 900, fontSize: `${size * 0.45}vw`,
        boxShadow: `0 1vh 2vh ${isMale ? "rgba(59,130,246,0.5)" : "rgba(236,72,153,0.5)"}`,
        zIndex: 5, flexShrink: 0
      }}>
        {showLetter ? letter : ""}
      </div>
    );
  };

  /* === Podium Cards === */
  const PodiumCard = ({ score, rank, color, height }: { score: any; rank: number; color: string; height: string }) => {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", flex: 1,
        animation: `podiumFloat ${3 + rank * 0.5}s ease-in-out infinite`,
        animationDelay: `${rank * 0.2}s`, margin: "0 1vw"
      }}>
        <div style={{ marginBottom: "-3vh", zIndex: 10 }}>
          {score ? (
            <Avatar name={score.participants?.first_name} gender={score.participants?.category} size={7} />
          ) : (
            <div style={{ width: "7vw", height: "7vw", borderRadius: "50%", background: "rgba(0,0,0,0.05)", zIndex: 5, position: "relative" }} />
          )}
        </div>
        <div style={{
          background: color, width: "100%", height, minHeight: "35vh",
          borderRadius: "2vh 2vh 0 0", display: "flex", flexDirection: "column",
          alignItems: "center", paddingTop: "5vh", paddingBottom: "2vh",
          boxShadow: "0 2vh 4vh rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,0.5)",
          border: "1px solid rgba(255,255,255,0.4)", transformStyle: "preserve-3d",
        }}>
          <span style={{ fontSize: "clamp(3rem, 5vw, 6.5rem)", fontWeight: 900, color: "rgba(0,0,0,0.2)", lineHeight: 1 }}>
            #{rank}
          </span>
          {score && (
            <>
              <span style={{
                fontSize: "clamp(2.4rem, 3.6vw, 5rem)", fontWeight: 800, color: "#1e293b",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "95%", textAlign: "center",
                lineHeight: 1.2, marginTop: "1vh"
              }}>
                {score.participants?.first_name}
              </span>
              <span style={{ fontSize: "clamp(2.8rem, 4vw, 6rem)", fontWeight: 900, color: "#475569", marginTop: "1vh" }}>
                {score.value}
              </span>
              <span style={{ fontSize: "clamp(1.4rem, 1.8vw, 2.5rem)", fontWeight: 700, color: "#94a3b8" }}>cm</span>
            </>
          )}
        </div>
      </div>
    );
  };

  /* === Left/Right Column Container === */
  const LeaderboardColumn = ({ title, data, themeColor, gender }: { title: string; data: any[]; themeColor: string; gender: string }) => {
    const top3 = [data[1], data[0], data[2]]; // Order: 2, 1, 3
    
    // Always create 5 slots for ranks 4 to 8
    const extendedList = [];
    for (let i = 3; i < 8; i++) {
      extendedList.push(data[i] || null);
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 2vw" }}>
        
        {/* Title */}
        <h2 style={{
          textAlign: "center", color: themeColor, fontSize: "clamp(2.5rem, 3.5vw, 5rem)",
          fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", fontStyle: "normal",
          marginBottom: "4vh", textShadow: "0 2px 10px rgba(0,0,0,0.05)"
        }}>
          {title}
        </h2>

        {/* Podium Area (Top 3) */}
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "center", width: "100%",
          height: "45vh", perspective: "800px", marginBottom: "3vh",
        }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", width: "100%", height: "100%", transform: "rotateX(2deg)" }}>
            <PodiumCard score={top3[0]} rank={2} color="rgba(255,255,255,0.7)" height="75%" />
            <PodiumCard score={top3[1]} rank={1} color="rgba(255,255,255,0.95)" height="95%" />
            <PodiumCard score={top3[2]} rank={3} color="rgba(255,255,255,0.5)" height="65%" />
          </div>
        </div>

        {/* Table Area (Ranks 4-8) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5vh" }}>
          <div style={{
            background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)",
            borderRadius: "2vh", padding: "2vh 3vw", border: "1px solid rgba(255,255,255,0.4)",
            display: "flex", flexDirection: "column", gap: "1.5vh", height: "100%"
          }}>
            {/* Header Row */}
            <div style={{ display: "flex", color: "#64748b", fontSize: "clamp(1.4rem, 1.8vw, 2.5rem)", fontWeight: 800, borderBottom: "2px solid rgba(0,0,0,0.05)", paddingBottom: "1vh" }}>
              <div style={{ width: "15%", textAlign: "center" }}>RANG</div>
              <div style={{ flex: 1 }}>ATHLÈTE</div>
              <div style={{ width: "20%", textAlign: "right" }}>SCORE</div>
            </div>

            {/* Always 5 Rows */}
            {extendedList.map((score, idx) => (
              <div key={idx} style={{
                display: "flex", alignItems: "center", padding: "1.5vh 0",
                borderBottom: idx === 4 ? "none" : "1px solid rgba(0,0,0,0.03)",
                opacity: score ? 1 : 0.4
              }}>
                <div style={{ width: "15%", textAlign: "center", color: "#94a3b8", fontWeight: 800, fontSize: "clamp(1.8rem, 2.4vw, 3.5rem)" }}>
                  {idx + 4}
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "2vw" }}>
                  <Avatar name={score?.participants?.first_name} gender={gender} size={4} showLetter={!!score} />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {score ? (
                      <strong style={{ color: "#1e293b", fontSize: "clamp(2.2rem, 3.2vw, 4.8rem)", fontWeight: 800 }}>
                        {score.participants?.first_name}
                      </strong>
                    ) : (
                      <strong style={{ background: "rgba(0,0,0,0.03)", borderRadius: "6px", width: "40%", height: "clamp(2.2rem, 3.2vw, 4.8rem)" }} />
                    )}
                  </div>
                </div>
                <div style={{ width: "20%", textAlign: "right", color: "#475569", fontWeight: 900, fontSize: "clamp(2.2rem, 3.2vw, 4.8rem)" }}>
                  {score ? score.value : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8fafc" }}>
      <h1 style={{ color: "#64748b", fontSize: "2vw", fontWeight: 700, animation: "pulse 1.5s infinite" }}>Chargement...</h1>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );

  return (
    <>
      <Head>
        <title>LiveBoard - Jump Contest</title>
      </Head>

      <main style={{
        width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden", position: "relative",
        background: "linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
      }}>
        
        {/* === Full-Screen Sponsor Overlay === */}
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          zIndex: 9999, background: "#000000",
          opacity: displayMode === 'carousel' ? 1 : 0,
          pointerEvents: displayMode === 'carousel' ? "auto" : "none",
          transition: "opacity 0.8s ease-in-out",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {displayMode === 'carousel' && sponsors[currentSponsorIndex] && isSponsorVisible && (
            sponsors[currentSponsorIndex].media_type === "video" ? (
              <video 
                 src={sponsors[currentSponsorIndex].media_url} 
                 autoPlay muted loop 
                 style={{ width: "100%", height: "100%", objectFit: "cover", animation: "fadeInMedia 0.5s ease" }} 
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                 src={sponsors[currentSponsorIndex].media_url} 
                 alt={sponsors[currentSponsorIndex].name}
                 style={{ width: "100%", height: "100%", objectFit: "contain", animation: "fadeInMedia 0.5s ease" }} 
              />
            )
          )}
        </div>

        {/* Geometric Animated Background */}
        <div style={{ position: "absolute", width: "100vw", height: "100vh", zIndex: 0, overflow: "hidden", filter: "blur(40px) opacity(0.5)" }}>
           <div style={{ position: "absolute", top: "10%", left: "10%", width: "40vw", height: "40vw", background: "rgba(59,130,246,0.3)", borderRadius: "50%", animation: "geoFloat 20s infinite alternate" }} />
           <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "50vw", height: "50vw", background: "rgba(236,72,153,0.3)", borderRadius: "50%", animation: "geoFloat 25s infinite alternate-reverse" }} />
           <div style={{ position: "absolute", top: "40%", left: "50%", width: "30vw", height: "30vw", background: "rgba(139,92,246,0.2)", borderRadius: "50%", animation: "geoFloat 18s infinite alternate" }} />
        </div>

        {/* Content Container */}
        <div style={{ display: "flex", flexDirection: "column", width: "100vw", height: "100vh", position: "relative", zIndex: 10, padding: "3vh 2vw" }}>
          
          {/* Main Header (Grid to perfectly center title and keep date right) */}
          <header style={{
            display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center",
            width: "100%", padding: "0 2vw 2vh", borderBottom: "1px solid rgba(0,0,0,0.05)"
          }}>
            <div />{/* Empty left column */}
            
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: "clamp(3rem, 4vw, 6rem)", fontWeight: 900, color: "#1e293b", letterSpacing: "-0.02em", margin: 0, textTransform: "uppercase" }}>
                Classement Jump Contest
              </h1>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "clamp(2rem, 2.5vw, 4rem)", fontWeight: 800, color: "#64748b", background: "rgba(255,255,255,0.6)", padding: "1vh 2vw", borderRadius: "1.5vh" }}>
                {new Date().toLocaleDateString("fr-FR")}
              </span>
            </div>
          </header>

          {/* Leaderboard Columns */}
          <div style={{ display: "flex", flex: 1, gap: "4vw", paddingTop: "4vh" }}>
            
            <div style={{ flex: 1, height: "100%", background: "linear-gradient(180deg, rgba(232,237,244,0) 0%, rgba(232,237,244,0.8) 100%)", borderRadius: "3vh" }}>
              <LeaderboardColumn title="Classement Masculin" data={topHommes} themeColor="#3b82f6" gender="Homme" />
            </div>

            <div style={{ width: "2px", height: "80%", background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.1), transparent)", margin: "auto 0" }} />

            <div style={{ flex: 1, height: "100%", background: "linear-gradient(180deg, rgba(244,224,232,0) 0%, rgba(244,224,232,0.8) 100%)", borderRadius: "3vh" }}>
              <LeaderboardColumn title="Classement Féminin" data={topFemmes} themeColor="#ec4899" gender="Femme" />
            </div>

          </div>

          <a href="/admin" target="_blank" style={{
            position: "absolute", bottom: "3vh", right: "3vw", padding: "1.5vh 1.5vw",
            background: "rgba(255,255,255,0.5)", color: "#1e293b", textDecoration: "none",
            borderRadius: "1vh", fontSize: "1vw", fontWeight: 700, backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.5)", transition: "all 0.2s z-index: 100",
          }}>
            Panel Admin
          </a>
        </div>

        {/* Animations */}
        <style>{`
          @keyframes podiumFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2vh); }
          }
          @keyframes geoFloat {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(10vw, 10vh) scale(1.1); }
          }
          @keyframes fadeInMedia {
            from { opacity: 0; transform: scale(1.05); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </main>
    </>
  );
}
