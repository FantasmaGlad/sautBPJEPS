"use client";

import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import { supabase } from "@/lib/supabase";
import { getWeightedScore } from "@/lib/ponderation";
import { ScoreOverlay } from "@/components/ScoreOverlay";

export default function Home() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // === SPONSOR CAROUSEL STATE ===
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaCache, setMediaCache] = useState<Record<string, string>>({});
  
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
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, async (payload) => {
        // Optimisation : Requête ciblée uniquement sur la seule ligne qui change (Au lieu de télécharger tout)
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const { data: newScore } = await supabase
             .from("scores")
             .select("*, participants(*)")
             .eq("id", payload.new.id)
             .single();
             
          if (newScore && newScore.is_active) {
            setScores(prev => {
              const filtered = prev.filter(s => s.id !== newScore.id);
              return [...filtered, newScore];
            });
          } else if (newScore && !newScore.is_active) {
            setScores(prev => prev.filter(s => s.id !== newScore.id));
          }
        } else if (payload.eventType === 'DELETE') {
           setScores(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
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

  // Préchargement des Blobs en mémoire (RAM) pour zéro consommation réseau et compatibilité max
  useEffect(() => {
    sponsors.forEach((sponsor) => {
      setMediaCache((prev) => {
        if (prev[sponsor.media_url]) return prev;
        
        fetch(sponsor.media_url)
          .then((res) => res.blob())
          .then((blob) => {
             const objectUrl = URL.createObjectURL(blob);
             setMediaCache((current) => ({ ...current, [sponsor.media_url]: objectUrl }));
          })
          .catch((err) => {
             console.error("Impossible de fetch la vidéo TV, fallback vers URL directe", err);
             setMediaCache((current) => ({ ...current, [sponsor.media_url]: sponsor.media_url }));
          });
          
        return { ...prev, [sponsor.media_url]: "loading" };
      });
    });
  }, [sponsors]);

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

        // Trigger video play if it's a video
        if (sponsor?.media_type === "video") {
           const vidInfo = videoRef.current;
           if (vidInfo) {
              vidInfo.currentTime = 0;
              const playPromise = vidInfo.play();
              if (playPromise !== undefined) {
                 playPromise.catch(e => console.error("TV AutoPlay blocked:", e));
              }
           }
           
           // FALLBACK TIMER (Sécurité absolue Smart TV)
           // Si la vidéo plante et "onEnded" n'est jamais appelé, on force le passage
           // après duration_sec + 2 secondes de marge d'erreur.
           const fallbackDurationMs = (sponsor?.duration_sec || 10) * 1000 + 2000;
           const safeTimer = setTimeout(() => {
              setIsSponsorVisible(false);
           }, fallbackDurationMs);
           
           return () => clearTimeout(safeTimer);
        }

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
      // Calcul du score pondéré avec sauts bruts et age category
      const weightedValue = getWeightedScore(
        score.value, 
        score.participants?.category || gender, 
        score.participants?.age_category || "U18"
      );
      
      const scoreWithWeight = { ...score, weightedValue };

      if (!bestScores[pid] || weightedValue > bestScores[pid].weightedValue) {
        bestScores[pid] = scoreWithWeight;
      }
    });

    return Object.values(bestScores).sort((a: any, b: any) => b.weightedValue - a.weightedValue);
  };

  const topHommes = getBestScoresByGender("Homme");
  const topFemmes = getBestScoresByGender("Femme");

  /* === NOUVEAU LEADER CELEBRATION === */
  const [leaderCelebration, setLeaderCelebration] = useState<{athleteName: string, score: string, theme: "homme"|"femme"} | null>(null);
  const prevTopHommeRef = useRef<any>(null);
  const prevTopFemmeRef = useRef<any>(null);

  useEffect(() => {
    if (scores.length === 0 || loading) return;

    if (topHommes.length > 0) {
      const currentTop = topHommes[0];
      const prevTop = prevTopHommeRef.current;
      if (prevTop && currentTop.id !== prevTop.id) {
         setLeaderCelebration({
            athleteName: `${currentTop.participants?.first_name} ${currentTop.participants?.last_name}`.toUpperCase(),
            score: (currentTop.weightedValue || currentTop.value).toString(),
            theme: "homme"
         });
         setDisplayMode("leaderboard");
         setCurrentSponsorIndex(0);
         setIsSponsorVisible(false);
      }
      prevTopHommeRef.current = currentTop;
    }

    if (topFemmes.length > 0) {
      const currentTop = topFemmes[0];
      const prevTop = prevTopFemmeRef.current;
      if (prevTop && currentTop.id !== prevTop.id) {
         setLeaderCelebration({
            athleteName: `${currentTop.participants?.first_name} ${currentTop.participants?.last_name}`.toUpperCase(),
            score: (currentTop.weightedValue || currentTop.value).toString(),
            theme: "femme"
         });
         setDisplayMode("leaderboard");
         setCurrentSponsorIndex(0);
         setIsSponsorVisible(false);
      }
      prevTopFemmeRef.current = currentTop;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores]);

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
        boxShadow: `0 0.5vh 1.5vh ${isMale ? "rgba(59,130,246,0.3)" : "rgba(236,72,153,0.3)"}`,
        zIndex: 5, flexShrink: 0
      }}>
        {showLetter ? letter : ""}
      </div>
    );
  };

  /* === Podium Cards === */
  const PodiumCard = ({ score, rank, themeRGB, height }: { score: any; rank: number; themeRGB: string; height: string }) => {
    const depth = "2.5vw"; 
    let zIndex = 5;
    if (rank === 2) zIndex = 5;
    if (rank === 1) zIndex = 10;
    if (rank === 3) zIndex = 15;
    
    // Extracted colors
    const topColor = rank === 1 ? `rgba(${themeRGB}, 0.15)` : `rgba(${themeRGB}, 0.25)`;
    const rightColor = rank === 1 ? `rgba(${themeRGB}, 0.3)` : `rgba(${themeRGB}, 0.45)`;
    const frontColor = rank === 1 ? `#ffffff` : `rgba(255,255,255,0.9)`;

    return (
      <div style={{
        position: "relative",
        width: "11vw",
        height,
        zIndex,
      }}>
        {/* Avatar Area */}
        <div style={{ 
          position: "absolute",
          top: "-7vw",
          left: "0",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          transform: `translateX(calc(${depth} / 2))`
        }}>
          {score ? (
            <Avatar name={score.participants?.first_name} gender={score.participants?.category} size={6} />
          ) : (
            <div style={{ width: "6vw", height: "6vw", borderRadius: "50%", background: `rgba(${themeRGB},0.15)`, zIndex: 5 }} />
          )}
        </div>

        {/* 3D Container */}
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%" }}>
          {/* Top Face */}
          <div style={{
            position: "absolute",
            top: `-${depth}`,
            left: 0,
            width: "100%",
            height: depth,
            background: topColor,
            transformOrigin: "bottom left",
            transform: "skewX(-45deg)",
          }} />

          {/* Right Face */}
          <div style={{
            position: "absolute",
            top: 0,
            right: `-${depth}`,
            width: depth,
            height: "100%",
            background: rightColor,
            transformOrigin: "top left",
            transform: "skewY(-45deg)",
          }} />

          {/* Front Face */}
          <div style={{
            position: "absolute",
            top: 0, left: 0, width: "100%", height: "100%",
            background: frontColor,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            boxShadow: "-1vh 1vh 2vh rgba(0,0,0,0.02)",
          }}>
            <span style={{ fontSize: "clamp(4rem, 6.5vw, 8rem)", fontWeight: 900, color: `rgba(${themeRGB},0.6)`, lineHeight: 1 }}>
              #{rank}
            </span>
            {score && (
              <>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "1vh" }}>
                  <span style={{ fontSize: "clamp(2.5rem, 3.5vw, 5rem)", fontWeight: 900, color: "#1e293b", lineHeight: 1 }}>
                    {score.weightedValue || score.value} <span style={{ fontSize: "50%", color: "#64748b" }}>pts</span>
                  </span>
                  <span style={{ fontSize: "clamp(1.2rem, 1.8vw, 2.5rem)", fontWeight: 700, color: "#94a3b8", lineHeight: 1, marginTop: "0.2vh" }}>
                    ({score.value} cm)
                  </span>
                </div>
                <span style={{
                  fontSize: "clamp(1.8rem, 2.5vw, 3.5rem)", fontWeight: 800, color: "#64748b",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90%", textAlign: "center",
                  lineHeight: 1.2, marginTop: "0.5vh"
                }}>
                  {score.participants?.first_name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* === Left/Right Column Container === */
  const LeaderboardColumn = ({ title, data, themeColor, gender }: { title: string; data: any[]; themeColor: string; gender: string }) => {
    const top3 = [data[1], data[0], data[2]]; // Order: 2, 1, 3
    
    // Always create 2 slots for ranks 4 and 5
    const extendedList = [];
    for (let i = 3; i < 5; i++) {
      extendedList.push(data[i] || null);
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 2vw" }}>
        
        {/* Title */}
        <h2 style={{
          textAlign: "center", color: themeColor, fontSize: "clamp(2.5rem, 3.5vw, 5rem)",
          fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", fontStyle: "normal",
          marginTop: "0", marginBottom: "4vh", textShadow: "0 2px 10px rgba(0,0,0,0.05)"
        }}>
          {title}
        </h2>

        {/* Vertically Centered Content Wrapper */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", paddingBottom: "2vh" }}>
          
          {/* Podium Area (Top 3) */}
          <div style={{
            display: "flex", alignItems: "flex-end", justifyContent: "center", width: "100%",
            height: "35vh", marginBottom: "3vh",
          }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", width: "100%", height: "100%", paddingRight: "2.5vw", paddingTop: "8vw" }}>
              <PodiumCard score={top3[0]} rank={2} themeRGB={gender === "Homme" || gender === "H" ? "59,130,246" : "236,72,153"} height="55%" />
              <PodiumCard score={top3[1]} rank={1} themeRGB={gender === "Homme" || gender === "H" ? "59,130,246" : "236,72,153"} height="75%" />
              <PodiumCard score={top3[2]} rank={3} themeRGB={gender === "Homme" || gender === "H" ? "59,130,246" : "236,72,153"} height="40%" />
            </div>
          </div>

          {/* Table Area (Ranks 4-5) */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{
              background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)",
              borderRadius: "2vh", padding: "1.5vh 3vw", border: "1px solid rgba(255,255,255,0.4)",
              display: "flex", flexDirection: "column", gap: "1vh"
            }}>
            {/* Header Row */}
            <div style={{ display: "flex", color: "#64748b", fontSize: "clamp(1.8rem, 2.5vw, 3.2rem)", fontWeight: 800, borderBottom: "2px solid rgba(0,0,0,0.05)", paddingBottom: "1vh" }}>
              <div style={{ width: "15%", textAlign: "center" }}>RANG</div>
              <div style={{ flex: 1, paddingLeft: "6vw" }}>ATHLÈTE</div>
              <div style={{ width: "20%", textAlign: "right", paddingRight: "1vw" }}>SCORE</div>
            </div>

            {/* Always 2 Rows */}
            {extendedList.map((score, idx) => (
              <div key={idx} style={{
                display: "flex", alignItems: "center", padding: "1.5vh 0",
                borderBottom: idx === 1 ? "none" : "1px solid rgba(0,0,0,0.03)",
                opacity: score ? 1 : 0.4
              }}>
                <div style={{ width: "15%", textAlign: "center", color: "#94a3b8", fontWeight: 800, fontSize: "clamp(2.2rem, 3vw, 4.5rem)" }}>
                  {idx + 4}
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "2vw" }}>
                  <Avatar name={score?.participants?.first_name} gender={gender} size={4} showLetter={!!score} />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {score ? (
                      <strong style={{ color: "#1e293b", fontSize: "clamp(2.8rem, 4vw, 5.5rem)", fontWeight: 800 }}>
                        {score.participants?.first_name}
                      </strong>
                    ) : (
                      <strong style={{ background: "rgba(0,0,0,0.03)", borderRadius: "6px", width: "40%", height: "clamp(2.8rem, 4vw, 5.5rem)" }} />
                    )}
                  </div>
                </div>
                <div style={{ width: "20%", textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" }}>
                  {score ? (
                    <>
                      <span style={{ color: "#475569", fontWeight: 900, fontSize: "clamp(2.5rem, 3.5vw, 5rem)", lineHeight: 1 }}>
                        {score.weightedValue || score.value} <span style={{ fontSize: "50%", color: "#94a3b8" }}>pts</span>
                      </span>
                      <span style={{ color: "#94a3b8", fontWeight: 700, fontSize: "clamp(1.2rem, 1.6vw, 2.5rem)", lineHeight: 1, marginTop: "0.2vh" }}>
                        ({score.value} cm)
                      </span>
                    </>
                  ) : (
                    <span style={{ color: "#475569", fontWeight: 900, fontSize: "clamp(2.8rem, 4vw, 5.5rem)" }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
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
          {/* Optimisation TV : Un SEUL lecteur vidéo/image avec source dynamique Blob depuis la RAM */}
          {(() => {
            const activeSponsor = sponsors[currentSponsorIndex];
            if (!activeSponsor) return null;

            const isVideo = activeSponsor.media_type === "video";
            const currentSrc = mediaCache[activeSponsor.media_url] && mediaCache[activeSponsor.media_url] !== "loading" 
                 ? mediaCache[activeSponsor.media_url] 
                 : activeSponsor.media_url;

            return (
              <>
                <video 
                   ref={videoRef}
                   src={isVideo ? currentSrc : undefined} 
                   autoPlay={isVideo}
                   muted playsInline preload="auto"
                   onEnded={() => { 
                      if (displayMode === 'carousel' && isSponsorVisible) setIsSponsorVisible(false); 
                   }}
                   style={{ 
                     position: "absolute",
                     width: "100%", height: "100%", objectFit: "cover", 
                     opacity: (isVideo && isSponsorVisible) ? 1 : 0,
                     transition: "opacity 0.5s ease",
                     pointerEvents: "none",
                     // Cache le lecteur si ce n'est pas une vidéo pour libérer le décodage matériel
                     display: isVideo ? "block" : "none"
                   }} 
                />
                <img
                   src={!isVideo ? currentSrc : undefined} 
                   alt="Sponsor Media"
                   style={{ 
                     position: "absolute",
                     width: "100%", height: "100%", objectFit: "contain",
                     opacity: (!isVideo && isSponsorVisible) ? 1 : 0,
                     transition: "opacity 0.5s ease",
                     pointerEvents: "none",
                     display: !isVideo ? "block" : "none"
                   }} 
                />
              </>
            );
          })()}
        </div>

        {/* Geometric Animated Background */}
        <div style={{ position: "absolute", width: "100vw", height: "100vh", zIndex: 0, overflow: "hidden", filter: "blur(40px) opacity(0.5)" }}>
           <div style={{ position: "absolute", top: "10%", left: "10%", width: "40vw", height: "40vw", background: "rgba(59,130,246,0.3)", borderRadius: "50%", animation: "geoFloat 20s infinite alternate" }} />
           <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "50vw", height: "50vw", background: "rgba(236,72,153,0.3)", borderRadius: "50%", animation: "geoFloat 25s infinite alternate-reverse" }} />
           <div style={{ position: "absolute", top: "40%", left: "50%", width: "30vw", height: "30vw", background: "rgba(139,92,246,0.2)", borderRadius: "50%", animation: "geoFloat 18s infinite alternate" }} />
        </div>

        {/* Content Container */}
        <div style={{ display: "flex", flexDirection: "column", width: "100vw", height: "100vh", position: "relative", zIndex: 10, padding: "3vh 2vw", boxSizing: "border-box" }}>
          
          {/* Main Header (Grid to perfectly center title and keep date right) */}
          <header style={{
            display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center",
            width: "100%", padding: "2vh 2vw 3vh", borderBottom: "1px solid rgba(0,0,0,0.05)"
          }}>
            <div style={{ textAlign: "left" }}>
              <a href="/admin" target="_blank" style={{
                display: "inline-block", padding: "1.5vh 1.5vw",
                background: "rgba(255,255,255,0.5)", color: "#1e293b", textDecoration: "none",
                borderRadius: "1vh", fontSize: "1vw", fontWeight: 700, backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.5)", transition: "all 0.2s"
              }}>
                Panel Admin
              </a>
            </div>
            
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: "clamp(3rem, 4vw, 6rem)", fontWeight: 900, color: "#1e293b", letterSpacing: "-0.02em", margin: 0, textTransform: "uppercase" }}>
                Classement Jump Contest
              </h1>
            </div>

            <div style={{ textAlign: "right", paddingRight: "3vw" }}>
              <span style={{
                display: "inline-block", padding: "1.5vh 1.5vw",
                background: "rgba(255,255,255,0.5)", color: "#1e293b",
                borderRadius: "1vh", fontSize: "1vw", fontWeight: 700, backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.5)"
              }}>
                {new Date().toLocaleDateString("fr-FR")}
              </span>
            </div>
          </header>

          {/* Leaderboard Columns */}
          <div style={{ display: "flex", flex: 1, gap: "4vw", paddingTop: "1vh" }}>
            
            <div style={{ flex: 1, height: "100%", background: "linear-gradient(180deg, rgba(232,237,244,0) 0%, rgba(232,237,244,0.8) 100%)", borderRadius: "3vh" }}>
              <LeaderboardColumn title="Classement Masculin" data={topHommes} themeColor="#3b82f6" gender="Homme" />
            </div>

            <div style={{ width: "2px", height: "80%", background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.1), transparent)", margin: "auto 0" }} />

            <div style={{ flex: 1, height: "100%", background: "linear-gradient(180deg, rgba(244,224,232,0) 0%, rgba(244,224,232,0.8) 100%)", borderRadius: "3vh" }}>
              <LeaderboardColumn title="Classement Féminin" data={topFemmes} themeColor="#ec4899" gender="Femme" />
            </div>

          </div>


        </div>

        {leaderCelebration && (
          <ScoreOverlay
            athleteName={leaderCelebration.athleteName}
            score={leaderCelebration.score}
            theme={leaderCelebration.theme}
            onEnd={() => setLeaderCelebration(null)}
          />
        )}

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
