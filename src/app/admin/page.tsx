"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // États d'ajout
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [category, setCategory] = useState("Homme");
  
  // États globaux
  const [participants, setParticipants] = useState<any[]>([]);
  const [scoresHistory, setScoresHistory] = useState<any[]>([]);
  
  // États score
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [selectedAgeCategory, setSelectedAgeCategory] = useState("");
  const [scoreValue, setScoreValue] = useState("");
  
  // États gestion profils
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
    if (!session) {
      router.push("/login");
    } else {
      setLoadingAuth(false);
    }
  };

  const fetchData = async () => {
    const { data: pData } = await supabase.from("participants").select("*").order("last_name");
    const { data: sData } = await supabase.from("scores")
      .select("*, participants(first_name, last_name, category)")
      .order("recorded_at", { ascending: false });

    if (pData) setParticipants(pData);
    if (sData) setScoresHistory(sData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // --- ACTIONS PARTICIPANTS ---
  const addParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("participants").insert([{
      first_name: firstName,
      last_name: lastName,
      category: category
    }]);
    
    if (error) setStatusMsg(`Erreur Création: ${error.message}`);
    else {
      setStatusMsg(`Le participant ${firstName} ${lastName} a bien été ajouté !`);
      setFirstName(""); setLastName("");
      fetchData();
    }
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const deleteParticipant = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`Supprimer complètement ${name} ? Tous ses sauts seront perdus !`);
    if (!confirmDelete) return;

    const { error } = await supabase.from("participants").delete().eq("id", id);
    if (!error) {
      setStatusMsg("Profil supprimé avec succès.");
      fetchData();
      setTimeout(() => setStatusMsg(""), 4000);
    } else {
      setStatusMsg(`Erreur: ${error.message}`);
    }
  };

  const saveParticipantEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;
    
    const { error } = await supabase.from("participants")
      .update({
        first_name: editingParticipant.first_name,
        last_name: editingParticipant.last_name,
        category: editingParticipant.category
      })
      .eq("id", editingParticipant.id);

    if (error) {
      setStatusMsg(`Erreur modif: ${error.message}`);
    } else {
      setStatusMsg("Profil mis à jour !");
      setEditingParticipant(null);
      fetchData();
    }
    setTimeout(() => setStatusMsg(""), 4000);
  };

  // --- ACTIONS SCORES ---
  const addScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant || !selectedAgeCategory || !scoreValue) return;

    const { error } = await supabase.from("scores").insert([{
      participant_id: selectedParticipant,
      age_category: selectedAgeCategory,
      value: parseFloat(scoreValue),
      is_active: true
    }]);

    if (error) setStatusMsg(`Erreur Score: ${error.message}`);
    else {
      setStatusMsg("Score enregistré avec succès (il apparaitra sur la vue TV).");
      setScoreValue("");
      fetchData();
    }
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const deleteScore = async (id: string) => {
    const confirmDelete = window.confirm("Es-tu sûr de vouloir supprimer ce score ?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("scores").delete().eq("id", id);
    if (!error) {
      setStatusMsg("Score supprimé !");
      fetchData();
      setTimeout(() => setStatusMsg(""), 4000);
    }
  };

  // --- FILTRES ---
  const filteredParticipants = participants.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loadingAuth) return <main style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#111827", color: "white" }}><p>Chargement du panel...</p></main>;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#e2e8f0", padding: "3rem 2rem", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem", borderBottom: "1px solid #334155", paddingBottom: "1rem" }}>
          <h1 style={{ color: "white", margin: 0 }}>Dashboard LiveBoard</h1>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={() => window.open("/", "_blank")} style={{ padding: "0.6rem 1.2rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
              📺 Vue TV
            </button>
            <button onClick={handleLogout} style={{ padding: "0.6rem 1.2rem", background: "transparent", color: "#f87171", border: "1px solid #f87171", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
              Quitter
            </button>
          </div>
        </header>

        {statusMsg && (
          <div style={{ padding: "1rem", background: "rgba(74, 222, 128, 0.1)", border: "1px solid rgba(74, 222, 128, 0.4)", borderRadius: "8px", marginBottom: "2rem", color: "#4ade80", fontWeight: 500 }}>
            {statusMsg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
          
          {/* Bloc Ajout Participant */}
          <section style={{ background: "#1e293b", padding: "2rem", borderRadius: "12px", border: "1px solid #334155", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", color: "white" }}>1. Inscrire un Athlète</h2>
            <form onSubmit={addParticipant} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="text" placeholder="Prénom" value={firstName} onChange={e => setFirstName(e.target.value)} required style={inputStyle} />
              <input type="text" placeholder="Nom" value={lastName} onChange={e => setLastName(e.target.value)} required style={inputStyle} />
              <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
              <button type="submit" style={btnStyle}>Enregistrer le participant</button>
            </form>
          </section>

          {/* Bloc Ajout Score */}
          <section style={{ background: "#1e293b", padding: "2rem", borderRadius: "12px", border: "1px solid #334155", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", color: "white" }}>2. Saisir une Performance</h2>
            <form onSubmit={addScore} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <select value={selectedParticipant} onChange={e => setSelectedParticipant(e.target.value)} required style={inputStyle}>
                <option value="">-- Choisir Participant --</option>
                {participants.map(p => (
                  <option key={p.id} value={p.id}>{p.last_name} {p.first_name} ({p.category})</option>
                ))}
              </select>

              <select value={selectedAgeCategory} onChange={e => setSelectedAgeCategory(e.target.value)} required style={inputStyle}>
                <option value="">-- Choisir Catégorie d&apos;Âge --</option>
                {AGE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <input type="number" step="0.01" placeholder="Valeur du saut/score (ex: 2.45)" value={scoreValue} onChange={e => setScoreValue(e.target.value)} required style={inputStyle} />
              <button type="submit" style={{...btnStyle, background: "#8b5cf6"}}>Valider et Diffuser le Score</button>
            </form>
          </section>
        </div>

        {/* Bloc Gestion Profils & Historique */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          
          <section style={{ background: "#1e293b", padding: "2rem", borderRadius: "12px", border: "1px solid #334155", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <h2 style={{ fontSize: "1.2rem", color: "white", margin: 0 }}>3. Gestion des Profils</h2>
              <input 
                type="text" 
                placeholder="Rechercher un athlète..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                style={{...inputStyle, width: "250px", padding: "0.5rem 1rem"}} 
              />
            </div>
            
            {editingParticipant && (
              <form onSubmit={saveParticipantEdit} style={{ background: "rgba(59, 130, 246, 0.1)", padding: "1.5rem", borderRadius: "8px", border: "1px solid #3b82f6", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", marginBottom: "2rem" }}>
                <strong style={{ color: "white", width: "100%" }}>Modifier le profil :</strong>
                <input type="text" value={editingParticipant.first_name} onChange={e => setEditingParticipant({...editingParticipant, first_name: e.target.value})} required style={{...inputStyle, padding: "0.5rem"}} />
                <input type="text" value={editingParticipant.last_name} onChange={e => setEditingParticipant({...editingParticipant, last_name: e.target.value})} required style={{...inputStyle, padding: "0.5rem"}} />
                <select value={editingParticipant.category} onChange={e => setEditingParticipant({...editingParticipant, category: e.target.value})} style={{...inputStyle, padding: "0.5rem"}}>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                  <option value="H">Homme (Legacy)</option>
                  <option value="F">Femme (Legacy)</option>
                </select>
                <button type="submit" style={{...btnStyle, marginTop: 0, padding: "0.5rem 1rem"}}>Sauvegarder</button>
                <button type="button" onClick={() => setEditingParticipant(null)} style={{ padding: "0.5rem 1rem", background: "transparent", color: "#94a3b8", border: "none", cursor: "pointer" }}>Annuler</button>
              </form>
            )}

            {filteredParticipants.length === 0 ? (
               <p style={{ color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>Aucun participant trouvé.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                      <th style={{ padding: "1rem" }}>NOM Prénom</th>
                      <th style={{ padding: "1rem" }}>Cat. Sexe</th>
                      <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.map(p => (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "1rem", fontWeight: "bold" }}>{p.last_name} {p.first_name}</td>
                        <td style={{ padding: "1rem" }}>
                          <span style={{ padding: "0.2rem 0.6rem", background: "rgba(255,255,255,0.05)", borderRadius: "12px", fontSize: "0.85rem" }}>
                            {p.category === 'H' ? 'Homme' : p.category === 'F' ? 'Femme' : p.category}
                          </span>
                        </td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <button onClick={() => setEditingParticipant(p)} style={{ marginRight: "0.5rem", padding: "0.4rem 0.8rem", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}>
                            Éditer
                          </button>
                          <button onClick={() => deleteParticipant(p.id, `${p.first_name} ${p.last_name}`)} style={{ padding: "0.4rem 0.8rem", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}>
                            Suppr.
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section style={{ background: "#1e293b", padding: "2rem", borderRadius: "12px", border: "1px solid #334155", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", color: "white" }}>4. Historique Rapide des Sauts</h2>
            {scoresHistory.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>Aucun saut enregistré pour le moment.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                      <th style={{ padding: "1rem" }}>Athlète</th>
                      <th style={{ padding: "1rem" }}>Genre / Âge</th>
                      <th style={{ padding: "1rem" }}>Date</th>
                      <th style={{ padding: "1rem" }}>Score</th>
                      <th style={{ padding: "1rem", textAlign: "right" }}>X</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoresHistory.map(score => (
                      <tr key={score.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "1rem", fontWeight: "bold" }}>
                          {score.participants?.first_name} {score.participants?.last_name}
                        </td>
                        <td style={{ padding: "1rem" }}>
                          {score.participants?.category === 'H' ? 'Homme' : score.participants?.category === 'F' ? 'Femme' : score.participants?.category} — {score.age_category}
                        </td>
                        <td style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.9rem" }}>
                          {new Date(score.recorded_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: "1rem", color: "#8b5cf6", fontWeight: "bold" }}>{score.value} M</td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <button onClick={() => deleteScore(score.id)} style={{ padding: "0.4rem 0.8rem", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}>
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}

const inputStyle = { padding: "0.75rem", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "white", fontSize: "0.95rem" };
const btnStyle = { padding: "0.75rem", borderRadius: "6px", background: "#3b82f6", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", marginTop: "0.5rem" };
