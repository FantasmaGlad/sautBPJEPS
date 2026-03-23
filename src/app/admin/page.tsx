"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ─── Shared Styles ─── */
const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.5)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
  padding: "2rem",
};

const inputStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "10px",
  border: "1px solid #ddd",
  background: "rgba(255,255,255,0.9)",
  color: "#1e293b",
  fontSize: "0.95rem",
  outline: "none",
  transition: "border-color 0.2s",
  width: "100%",
  boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #4a90d9, #357abd)",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "0.95rem",
  transition: "transform 0.15s, box-shadow 0.15s",
  boxShadow: "0 4px 12px rgba(74,144,217,0.3)",
};

const btnPurple: React.CSSProperties = {
  ...btnPrimary,
  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
};

const btnDanger: React.CSSProperties = {
  padding: "0.4rem 0.8rem",
  borderRadius: "8px",
  background: "rgba(239,68,68,0.08)",
  color: "#ef4444",
  border: "1px solid rgba(239,68,68,0.2)",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 600,
};

const btnEdit: React.CSSProperties = {
  padding: "0.4rem 0.8rem",
  borderRadius: "8px",
  background: "rgba(74,127,189,0.08)",
  color: "#4a7fbd",
  border: "1px solid rgba(74,127,189,0.2)",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 600,
  marginRight: "0.5rem",
};

/* ─── Avatar ─── */
const Avatar = ({ name, gender, size = 36 }: { name: string; gender: string; size?: number }) => {
  const letter = name?.charAt(0)?.toUpperCase() || "?";
  const isMale = gender === "Homme" || gender === "H";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: isMale ? "linear-gradient(135deg, #4a90d9, #357abd)" : "linear-gradient(135deg, #d94a8a, #bd357a)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 800, fontSize: size * 0.42,
      boxShadow: `0 2px 8px ${isMale ? "rgba(74,144,217,0.3)" : "rgba(217,74,138,0.3)"}`,
    }}>
      {letter}
    </div>
  );
};

/* ═══════════════════════════════════════
   Admin Page
   ═══════════════════════════════════════ */
export default function AdminPage() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [category, setCategory] = useState("Homme");
  const [ageCategory, setAgeCategory] = useState("U18");

  const [participants, setParticipants] = useState<any[]>([]);
  const [scoresHistory, setScoresHistory] = useState<any[]>([]);

  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [scoreValue, setScoreValue] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [editingParticipant, setEditingParticipant] = useState<any>(null);

  const [statusMsg, setStatusMsg] = useState("");

  const AGE_CATEGORIES = ["U18", "U23", "M35", "M40", "M45", "M50", "M55", "M60", "M65", "M70", "M75", "M80"];

  useEffect(() => {
    checkUser();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); } else { setLoadingAuth(false); }
  };

  const fetchData = async () => {
    const { data: pData } = await supabase.from("participants").select("*").order("last_name");
    const { data: sData } = await supabase.from("scores")
      .select("*, participants(first_name, last_name, category, age_category)")
      .order("recorded_at", { ascending: false });
    if (pData) setParticipants(pData);
    if (sData) setScoresHistory(sData);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };

  const addParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("participants").insert([{
      first_name: firstName, last_name: lastName, category, age_category: ageCategory
    }]);
    if (error) setStatusMsg(`Erreur: ${error.message}`);
    else { setStatusMsg(`${firstName} ${lastName} inscrit !`); setFirstName(""); setLastName(""); fetchData(); }
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const deleteParticipant = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer ${name} ? Tous ses sauts seront perdus !`)) return;
    const { error } = await supabase.from("participants").delete().eq("id", id);
    if (!error) { setStatusMsg("Profil supprimé."); fetchData(); }
    else setStatusMsg(`Erreur: ${error.message}`);
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const saveParticipantEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;
    const { error } = await supabase.from("participants")
      .update({ first_name: editingParticipant.first_name, last_name: editingParticipant.last_name, category: editingParticipant.category, age_category: editingParticipant.age_category })
      .eq("id", editingParticipant.id);
    if (error) setStatusMsg(`Erreur: ${error.message}`);
    else { setStatusMsg("Profil mis à jour !"); setEditingParticipant(null); fetchData(); }
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const addScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant || !scoreValue) return;
    const { error } = await supabase.from("scores").insert([{ participant_id: selectedParticipant, value: parseInt(scoreValue, 10), is_active: true }]);
    if (error) setStatusMsg(`Erreur: ${error.message}`);
    else { setStatusMsg("Score diffusé en direct !"); setScoreValue(""); fetchData(); }
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const deleteScore = async (id: string) => {
    if (!window.confirm("Supprimer ce score ?")) return;
    const { error } = await supabase.from("scores").delete().eq("id", id);
    if (!error) { setStatusMsg("Score supprimé."); fetchData(); }
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const filteredParticipants = participants.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loadingAuth) return (
    <main style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "linear-gradient(160deg, #f0f4f8, #e8ecf2)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", color: "#475569" }}>
        <div style={{ width: 24, height: 24, border: "3px solid #4a90d9", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        Chargement...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );

  return (
    <main style={{
      minHeight: "100vh", margin: 0, position: "relative", overflow: "hidden",
      background: "linear-gradient(160deg, #f0f4f8 0%, #e8ecf2 40%, #f5eef2 100%)",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: "#1e293b", padding: 0,
    }}>
      {/* Geometric BG */}
      {[
        { top: "5%", left: "3%", size: 50, color: "rgba(74,144,217,0.06)", shape: "circle", dur: "20s" },
        { top: "80%", left: "90%", size: 70, color: "rgba(217,74,138,0.05)", shape: "circle", dur: "25s" },
        { top: "15%", left: "85%", size: 45, color: "rgba(139,92,246,0.05)", shape: "square", dur: "18s" },
        { top: "70%", left: "8%", size: 55, color: "rgba(74,127,189,0.05)", shape: "triangle", dur: "22s" },
        { top: "45%", left: "50%", size: 80, color: "rgba(130,130,200,0.03)", shape: "circle", dur: "30s" },
      ].map((s, i) => (
        <div key={i} style={{
          position: "absolute", top: s.top, left: s.left, width: s.size, height: s.size,
          background: s.color, pointerEvents: "none", zIndex: 0,
          borderRadius: s.shape === "circle" ? "50%" : s.shape === "square" ? "6px" : "0",
          clipPath: s.shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : undefined,
          animation: `adminFloat ${s.dur} ease-in-out infinite`,
        }} />
      ))}

      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.2rem 2.5rem", position: "relative", zIndex: 10,
        borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.5)",
        backdropFilter: "blur(20px)",
      }}>
        <h1 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#334155", margin: 0 }}>
          ⚙️ Dashboard Admin
        </h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={() => window.open("/", "_blank")} style={{
            padding: "0.5rem 1rem", background: "rgba(74,127,189,0.1)", color: "#4a7fbd",
            border: "1px solid rgba(74,127,189,0.2)", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
          }}>
            📺 Vue TV
          </button>
          <button onClick={handleLogout} style={{
            padding: "0.5rem 1rem", background: "rgba(239,68,68,0.06)", color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
          }}>
            Déconnexion
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "2rem 2.5rem", position: "relative", zIndex: 10 }}>

        {/* Status banner */}
        {statusMsg && (
          <div style={{
            padding: "0.85rem 1.25rem", borderRadius: "12px", marginBottom: "1.5rem", fontWeight: 600, fontSize: "0.9rem",
            background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#16a34a",
            animation: "fadeIn 0.3s ease",
          }}>
            ✓ {statusMsg}
          </div>
        )}

        {/* ── Top Row: Add Participant + Add Score ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>

          {/* Add Participant */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#334155", margin: "0 0 1.25rem" }}>
              <span style={{ marginRight: "0.5rem" }}>👤</span> Inscrire un Athlète
            </h2>
            <form onSubmit={addParticipant} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input type="text" placeholder="Prénom" value={firstName} onChange={e => setFirstName(e.target.value)} required style={inputStyle} />
              <input type="text" placeholder="Nom" value={lastName} onChange={e => setLastName(e.target.value)} required style={inputStyle} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
                <select value={ageCategory} onChange={e => setAgeCategory(e.target.value)} style={inputStyle}>
                  {AGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" style={btnPrimary}>Enregistrer</button>
            </form>
          </div>

          {/* Add Score */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#334155", margin: "0 0 1.25rem" }}>
              <span style={{ marginRight: "0.5rem" }}>🏅</span> Saisir une Performance
            </h2>
            <form onSubmit={addScore} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <select value={selectedParticipant} onChange={e => setSelectedParticipant(e.target.value)} required style={inputStyle}>
                <option value="">— Choisir un athlète —</option>
                {participants.map(p => (
                  <option key={p.id} value={p.id}>{p.last_name} {p.first_name} ({p.category} · {p.age_category || 'U18'})</option>
                ))}
              </select>
              <input type="number" step="1" placeholder="Valeur en cm (ex: 245)" value={scoreValue} onChange={e => setScoreValue(e.target.value)} required style={inputStyle} />
              <button type="submit" style={btnPurple}>Valider et Diffuser</button>
            </form>
          </div>
        </div>

        {/* ── Profiles Management ── */}
        <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#334155", margin: 0 }}>
              <span style={{ marginRight: "0.5rem" }}>📋</span> Gestion des Profils
            </h2>
            <input
              type="text" placeholder="🔍 Rechercher..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, width: "220px", padding: "0.55rem 0.85rem", fontSize: "0.88rem" }}
            />
          </div>

          {/* Edit form */}
          {editingParticipant && (
            <form onSubmit={saveParticipantEdit} style={{
              background: "rgba(74,127,189,0.06)", padding: "1.25rem", borderRadius: "12px",
              border: "1px solid rgba(74,127,189,0.15)", display: "flex", flexWrap: "wrap", gap: "0.75rem",
              alignItems: "center", marginBottom: "1.25rem",
            }}>
              <strong style={{ width: "100%", color: "#334155", fontSize: "0.9rem" }}>✏️ Modifier le profil</strong>
              <input type="text" value={editingParticipant.first_name} onChange={e => setEditingParticipant({...editingParticipant, first_name: e.target.value})} required style={{...inputStyle, flex: 1, minWidth: "120px"}} />
              <input type="text" value={editingParticipant.last_name} onChange={e => setEditingParticipant({...editingParticipant, last_name: e.target.value})} required style={{...inputStyle, flex: 1, minWidth: "120px"}} />
              <select value={editingParticipant.category} onChange={e => setEditingParticipant({...editingParticipant, category: e.target.value})} style={{...inputStyle, width: "auto", flex: "0 0 auto"}}>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
              <select value={editingParticipant.age_category || 'U18'} onChange={e => setEditingParticipant({...editingParticipant, age_category: e.target.value})} style={{...inputStyle, width: "auto", flex: "0 0 auto"}}>
                {AGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" style={{...btnPrimary, padding: "0.55rem 1rem", fontSize: "0.85rem"}}>Sauvegarder</button>
              <button type="button" onClick={() => setEditingParticipant(null)} style={{ padding: "0.55rem 1rem", background: "transparent", color: "#94a3b8", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>Annuler</button>
            </form>
          )}

          {/* Participants table */}
          {filteredParticipants.length === 0 ? (
            <p style={{ color: "#94a3b8", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>Aucun participant trouvé.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
                <thead>
                  <tr style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Athlète</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Genre / Âge</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((p, idx) => (
                    <tr key={p.id} style={{ background: idx % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)", borderRadius: "8px" }}>
                      <td style={{ padding: "0.75rem 1rem", borderRadius: "8px 0 0 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                          <Avatar name={p.first_name} gender={p.category} size={32} />
                          <strong style={{ color: "#1e293b" }}>{p.last_name} {p.first_name}</strong>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{
                          padding: "0.2rem 0.6rem", borderRadius: "100px", fontSize: "0.8rem", fontWeight: 600,
                          background: (p.category === "Homme" || p.category === "H") ? "rgba(74,127,189,0.1)" : "rgba(189,74,127,0.1)",
                          color: (p.category === "Homme" || p.category === "H") ? "#4a7fbd" : "#bd4a7f",
                        }}>
                          {p.category === 'H' ? 'Homme' : p.category === 'F' ? 'Femme' : p.category}
                        </span>
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
                          {p.age_category || 'U18'}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right", borderRadius: "0 8px 8px 0" }}>
                        <button onClick={() => setEditingParticipant(p)} style={btnEdit}>Éditer</button>
                        <button onClick={() => deleteParticipant(p.id, `${p.first_name} ${p.last_name}`)} style={btnDanger}>Suppr.</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Scores History ── */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#334155", margin: "0 0 1.25rem" }}>
            <span style={{ marginRight: "0.5rem" }}>📊</span> Historique des Sauts
          </h2>
          {scoresHistory.length === 0 ? (
            <p style={{ color: "#94a3b8", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>Aucun saut enregistré.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
                <thead>
                  <tr style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Athlète</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Heure</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Score</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {scoresHistory.map((score, idx) => (
                    <tr key={score.id} style={{ background: idx % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)" }}>
                      <td style={{ padding: "0.75rem 1rem", borderRadius: "8px 0 0 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                          <Avatar name={score.participants?.first_name || ""} gender={score.participants?.category || ""} size={28} />
                          <strong style={{ color: "#1e293b", fontSize: "0.9rem" }}>
                            {score.participants?.first_name} {score.participants?.last_name}
                          </strong>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.88rem" }}>
                        {new Date(score.recorded_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ fontWeight: 800, color: "#7c3aed", fontSize: "1rem" }}>{score.value}</span>
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem", marginLeft: "2px" }}>cm</span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right", borderRadius: "0 8px 8px 0" }}>
                        <button onClick={() => deleteScore(score.id)} style={btnDanger}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes adminFloat {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-12px) translateX(6px); }
          66% { transform: translateY(-4px) translateX(-8px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
