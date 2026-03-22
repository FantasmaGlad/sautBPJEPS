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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/admin");
    }
    setLoading(false);
  };

  return (
    <main style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", backgroundColor: "#0f0c29", color: "white", fontFamily: "sans-serif"
    }}>
      <div style={{
        padding: "2.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "16px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)", width: "100%", maxWidth: "420px",
        border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)"
      }}>
        <h1 style={{ marginBottom: "2rem", textAlign: "center", fontSize: "1.8rem" }}>Panel Administrateur</h1>
        
        {error && <p style={{ color: "#fca5a5", marginBottom: "1.5rem", fontSize: "0.9rem", textAlign: "center", background: "rgba(239, 68, 68, 0.2)", padding: "0.5rem", borderRadius: "6px" }}>{error}</p>}
        
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.85rem", borderRadius: "8px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white",
              fontWeight: "bold", border: "none", cursor: loading ? "not-allowed" : "pointer", marginTop: "1rem",
              transition: "transform 0.1s"
            }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}

const inputStyle = {
  padding: "0.85rem",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.2)",
  color: "white",
  fontSize: "1rem",
  outline: "none"
};
