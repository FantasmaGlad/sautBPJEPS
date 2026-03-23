"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); }
    else { router.push("/admin"); }
    setLoading(false);
  };

  return (
    <main style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", margin: 0, position: "relative", overflow: "hidden",
      background: "linear-gradient(160deg, #edf1f7 0%, #e4e8f0 30%, #f2e8ee 70%, #edf1f7 100%)",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      color: "#1e293b", padding: "2rem",
    }}>
      {/* Geometric BG shapes */}
      {[
        { top: "8%", left: "10%", size: 70, color: "rgba(74,144,217,0.07)", shape: "circle", dur: "14s" },
        { top: "70%", left: "80%", size: 90, color: "rgba(217,74,138,0.06)", shape: "circle", dur: "18s" },
        { top: "20%", left: "75%", size: 50, color: "rgba(139,92,246,0.06)", shape: "triangle", dur: "12s" },
        { top: "60%", left: "15%", size: 45, color: "rgba(74,127,189,0.06)", shape: "diamond", dur: "16s" },
        { top: "40%", left: "55%", size: 100, color: "rgba(130,130,200,0.04)", shape: "circle", dur: "22s" },
        { top: "85%", left: "45%", size: 35, color: "rgba(200,100,150,0.07)", shape: "hexagon", dur: "15s" },
        { top: "5%", left: "45%", size: 40, color: "rgba(100,180,220,0.06)", shape: "diamond", dur: "20s" },
        { top: "50%", left: "5%", size: 55, color: "rgba(180,120,200,0.05)", shape: "triangle", dur: "17s" },
      ].map((s, i) => {
        let borderRadius = "0";
        let clipPath: string | undefined;
        if (s.shape === "circle") borderRadius = "50%";
        else if (s.shape === "triangle") clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
        else if (s.shape === "diamond") clipPath = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
        else if (s.shape === "hexagon") clipPath = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
        return (
          <div key={i} style={{
            position: "absolute", top: s.top, left: s.left, width: s.size, height: s.size,
            background: s.color, borderRadius, clipPath,
            animation: `loginFloat ${s.dur} ease-in-out infinite`,
            pointerEvents: "none", zIndex: 0,
          }} />
        );
      })}

      {/* Login Card */}
      <div style={{
        position: "relative", zIndex: 10,
        padding: "3rem", width: "100%", maxWidth: "440px",
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.5)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
      }}>
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: "16px", margin: "0 auto 1.5rem",
          background: "linear-gradient(135deg, #4a90d9, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 20px rgba(74,144,217,0.3)",
          fontSize: "1.5rem",
        }}>
          🔒
        </div>

        <h1 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.25rem" }}>
          Panel Administrateur
        </h1>
        <p style={{ textAlign: "center", fontSize: "0.9rem", color: "#94a3b8", margin: "0 0 2rem", fontWeight: 400 }}>
          Connectez-vous pour gérer le classement
        </p>

        {error && (
          <div style={{
            padding: "0.75rem 1rem", borderRadius: "10px", marginBottom: "1.25rem",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
            color: "#dc2626", fontSize: "0.88rem", fontWeight: 500, textAlign: "center",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            style={inputStyle}
          />
          <input
            type="password" placeholder="Mot de passe" value={password}
            onChange={e => setPassword(e.target.value)} required
            style={inputStyle}
          />
          <button type="submit" disabled={loading} style={{
            padding: "0.85rem", borderRadius: "12px",
            background: "linear-gradient(135deg, #4a90d9, #7c3aed)",
            color: "white", fontWeight: 700, border: "none",
            cursor: loading ? "wait" : "pointer", marginTop: "0.5rem",
            fontSize: "1rem", boxShadow: "0 6px 20px rgba(74,144,217,0.3)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes loginFloat {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
          33%  { transform: translate(15px, -20px) rotate(60deg); opacity: 1; }
          66%  { transform: translate(-10px, -12px) rotate(180deg); opacity: 0.5; }
        }
      `}</style>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.85rem 1rem",
  borderRadius: "12px",
  border: "1px solid #ddd",
  background: "rgba(255,255,255,0.8)",
  color: "#1e293b",
  fontSize: "1rem",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
  transition: "border-color 0.2s",
};
