"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // États de l'interface
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [category, setCategory] = useState("H");
  const [participants, setParticipants] = useState<any[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [scoreValue, setScoreValue] = useState("");
  
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    checkUser();
    fetchData();
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
    const { data: dData } = await supabase.from("disciplines").select("*");
    if (pData) setParticipants(pData);
    if (dData) setDisciplines(dData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

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
      fetchData(); // Rafraîchir pour faire apparaitre dans liste déroulante
    }
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const addScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant || !selectedDiscipline || !scoreValue) return;

    const { error } = await supabase.from("scores").insert([{
      participant_id: selectedParticipant,
      discipline_id: selectedDiscipline,
      value: parseFloat(scoreValue),
      is_active: true
    }]);

    if (error) setStatusMsg(`Erreur Score: ${error.message}`);
    else {
      setStatusMsg("Score enregistré avec succès (il apparaitra sur la vue TV).");
      setScoreValue("");
    }
    setTimeout(() => setStatusMsg(""), 4000);
  };

  if (loadingAuth) return <main style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#111827", color: "white" }}><p>Chargement du panel...</p></main>;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "e2e8f0", padding: "3rem 2rem", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem", borderBottom: "1px solid #334155", paddingBottom: "1rem" }}>
          <h1 style={{ color: "white", margin: 0 }}>Dashboard LiveBoard</h1>
          <button onClick={handleLogout} style={{ padding: "0.6rem 1.2rem", background: "transparent", color: "#f87171", border: "1px solid #f87171", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
            Quitter le panel
          </button>
        </header>

        {statusMsg && (
          <div style={{ padding: "1rem", background: "rgba(74, 222, 128, 0.1)", border: "1px solid rgba(74, 222, 128, 0.4)", borderRadius: "8px", marginBottom: "2rem", color: "#4ade80", fontWeight: 500 }}>
            {statusMsg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          
          {/* Bloc Ajout Participant */}
          <section style={{ background: "#1e293b", padding: "2rem", borderRadius: "12px", border: "1px solid #334155", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", color: "white" }}>1. Inscrire un Athlète</h2>
            <form onSubmit={addParticipant} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="text" placeholder="Prénom" value={firstName} onChange={e => setFirstName(e.target.value)} required style={inputStyle} />
              <input type="text" placeholder="Nom" value={lastName} onChange={e => setLastName(e.target.value)} required style={inputStyle} />
              <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                <option value="H">Homme (H)</option>
                <option value="F">Femme (F)</option>
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
                  <option key={p.id} value={p.id}>{p.last_name} {p.first_name}</option>
                ))}
              </select>

              <select value={selectedDiscipline} onChange={e => setSelectedDiscipline(e.target.value)} required style={inputStyle}>
                <option value="">-- Choisir Discipline --</option>
                {disciplines.length === 0 && <option disabled>⚠️ Aucune discipline trouvée</option>}
                {disciplines.map(d => (
                  <option key={d.id} value={d.id}>{d.name} (Coeff {d.coefficient})</option>
                ))}
              </select>

              <input type="number" step="0.01" placeholder="Valeur du saut/score (ex: 2.45)" value={scoreValue} onChange={e => setScoreValue(e.target.value)} required style={inputStyle} />
              <button type="submit" style={{...btnStyle, background: "#8b5cf6"}}>Valider et Diffuser le Score</button>
            </form>
          </section>

        </div>
      </div>
    </main>
  );
}

const inputStyle = { padding: "0.85rem", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "white", fontSize: "0.95rem" };
const btnStyle = { padding: "0.85rem", borderRadius: "6px", background: "#3b82f6", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", marginTop: "0.5rem" };
