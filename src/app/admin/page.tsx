/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadAvatar, deleteAvatar, getAvatarPublicUrl, listAvatars, uploadToGallery } from "@/lib/avatars";

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
  padding: "0.85rem 1.25rem",
  borderRadius: "10px",
  border: "1px solid #ddd",
  background: "rgba(255,255,255,0.9)",
  color: "#1e293b",
  fontSize: "1rem",
  outline: "none",
  transition: "border-color 0.2s",
  width: "100%",
  boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  padding: "0.85rem 1.5rem",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #4a90d9, #357abd)",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "1rem",
  transition: "transform 0.15s, box-shadow 0.15s",
  boxShadow: "0 4px 12px rgba(74,144,217,0.3)",
};

const btnPurple: React.CSSProperties = {
  ...btnPrimary,
  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
};

const btnDanger: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  background: "rgba(239,68,68,0.08)",
  color: "#ef4444",
  border: "1px solid rgba(239,68,68,0.2)",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: 600,
  transition: "background 0.15s",
};

const btnEdit: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  background: "rgba(74,127,189,0.08)",
  color: "#4a7fbd",
  border: "1px solid rgba(74,127,189,0.2)",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: 600,
  marginRight: "0.5rem",
};

const btnSuccess: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  background: "rgba(34,197,94,0.1)",
  color: "#16a34a",
  border: "1px solid rgba(34,197,94,0.3)",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: 700,
  marginRight: "0.5rem",
};

/* ─── Avatar ─── */
const Avatar = ({ name, gender, size = 36, avatarUrl }: { name: string; gender: string; size?: number, avatarUrl?: string }) => {
  if (avatarUrl) {
    return (
      <img
        src={getAvatarPublicUrl(avatarUrl)}
        alt={`Avatar de ${name}`}
        style={{
          width: size, height: size, borderRadius: "50%", flexShrink: 0,
          objectFit: "cover",
          boxShadow: `0 2px 8px ${gender === "Homme" || gender === "H" ? "rgba(74,144,217,0.3)" : "rgba(217,74,138,0.3)"}`,
        }}
      />
    );
  }

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

  // Tabs
  const [activeTab, setActiveTab] = useState<'athletes' | 'sponsors' | 'avatars'>('athletes');

  // Participants Data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [category, setCategory] = useState("Homme");
  const [ageCategory, setAgeCategory] = useState("U18");

  const [participants, setParticipants] = useState<any[]>([]);
  const [scoresHistory, setScoresHistory] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [historySearchQuery, setHistorySearchQuery] = useState(""); // Add history search
  
  // Gallery
  const [galleryAvatars, setGalleryAvatars] = useState<any[]>([]);

  const [editingParticipant, setEditingParticipant] = useState<any>(null);
  
  const [uploadingAvatarId, setUploadingAvatarId] = useState<string | null>(null);
  
  const [inlineScoreParticipantId, setInlineScoreParticipantId] = useState<string | null>(null);
  const [inlineScoreValue, setInlineScoreValue] = useState("");

  // Sponsors & Settings Data
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  
  // Sponsors Form
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorOrder, setSponsorOrder] = useState("1");
  const [sponsorDuration, setSponsorDuration] = useState("10");
  const [sponsorFile, setSponsorFile] = useState<File | null>(null);
  const [uploadingSponsor, setUploadingSponsor] = useState(false);

  // Global Settings Form
  const [settingBreakMin, setSettingBreakMin] = useState("3");
  const [settingDelaySec, setSettingDelaySec] = useState("1");

  const [statusMsg, setStatusMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

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
    // Athletes & Scores
    const { data: pData } = await supabase.from("participants").select("*").order("last_name");
    const { data: sData } = await supabase.from("scores")
      .select("*, participants(first_name, last_name, category, age_category)")
      .order("recorded_at", { ascending: false });
    if (pData) setParticipants(pData);
    if (sData) setScoresHistory(sData);

    // Sponsors & Settings
    const { data: spData } = await supabase.from("sponsors").select("*").order("display_order");
    if (spData) setSponsors(spData);

    const { data: setObj, error: setErr } = await supabase.from("settings").select("*").limit(1).single();
    if (setObj) {
      setGlobalSettings(setObj);
      setSettingBreakMin(setObj.carousel_interval_min?.toString() || "3");
      setSettingDelaySec(setObj.carousel_duration_sec?.toString() || "1"); // We map carousel_duration_sec to time between slides
    }

    // Load Gallery avatars
    const files = await listAvatars();
    setGalleryAvatars(files);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 4000);
  };

  /* --- ATHLETES ACTIONS --- */
  const addParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("participants").insert([{
      first_name: firstName, last_name: lastName, category, age_category: ageCategory
    }]);
    if (error) showStatus(`Erreur: ${error.message}`);
    else { showStatus(`${firstName} ${lastName} inscrit !`); setFirstName(""); setLastName(""); fetchData(); }
  };

  const deleteParticipant = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer ${name} ? Tous ses sauts seront perdus !`)) return;
    const { error } = await supabase.from("participants").delete().eq("id", id);
    if (!error) { showStatus("Profil supprimé."); fetchData(); }
    else showStatus(`Erreur: ${error.message}`);
  };

  const saveParticipantEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;
    const { error } = await supabase.from("participants")
      .update({ 
         first_name: editingParticipant.first_name, 
         last_name: editingParticipant.last_name, 
         category: editingParticipant.category, 
         age_category: editingParticipant.age_category,
         avatar_url: editingParticipant.avatar_url 
      })
      .eq("id", editingParticipant.id);
    if (error) showStatus(`Erreur: ${error.message}`);
    else { showStatus("Profil mis à jour !"); setEditingParticipant(null); fetchData(); }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      showStatus("Envoi dans la galerie en cours...");
      await uploadToGallery(file);
      showStatus("Avatar ajouté à la galerie !");
      fetchData(); // Reloader la galerie
    } catch(err: any) {
      showStatus(`Erreur d'upload: ${err.message}`);
    } finally {
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = "";
    }
  };

  const handleGalleryDelete = async (path: string) => {
    if(!window.confirm("Supprimer cet avatar de la galerie ? Attention, les athlètes utilisant cet avatar auront un espace vide jusqu'à leur prochaine mise à jour.")) return;
    try {
      await deleteAvatar(path);
      showStatus("Avatar supprimé de la galerie.");
      fetchData();
    } catch(err: any) {
      showStatus(`Erreur de suppression: ${err.message}`);
    }
  };

  const submitScore = async (participantId: string, valStr: string) => {
    if (!participantId || !valStr) return;
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;

    const { error } = await supabase.from("scores").insert([{ participant_id: participantId, value: val, is_active: true }]);
    if (error) {
      showStatus(`Erreur: ${error.message}`);
    } else {
      showStatus("Saut enregistré avec succès !");
      setInlineScoreValue(""); 
      setInlineScoreParticipantId(null); 
      fetchData();
    }
  };

  const addScoreFromInlineForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (inlineScoreParticipantId) {
      submitScore(inlineScoreParticipantId, inlineScoreValue);
    }
  };

  const deleteScore = async (id: string) => {
    if (!window.confirm("Supprimer ce saut ?")) return;
    const { error } = await supabase.from("scores").delete().eq("id", id);
    if (!error) { showStatus("Saut supprimé."); fetchData(); }
  };

  /* --- SPONSORS ACTIONS --- */
  const handleSponsorUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorFile) { showStatus("Veuillez sélectionner un fichier."); return; }
    
    setUploadingSponsor(true);
    const ext = sponsorFile.name.split('.').pop();
    const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    
    const { data, error } = await supabase.storage.from("sponsors-media").upload(filename, sponsorFile);
    if (error) { 
      showStatus(`Erreur upload: ${error.message}`); 
      setUploadingSponsor(false); 
      return; 
    }
    
    const { data: publicData } = supabase.storage.from("sponsors-media").getPublicUrl(filename);
    const mediaUrl = publicData.publicUrl;
    const isVideo = sponsorFile.type.startsWith("video/") || ext === "mp4" || ext === "webm";
    
    const { error: dbError } = await supabase.from("sponsors").insert([{
      name: sponsorName || "Sponsor",
      media_url: mediaUrl,
      media_type: isVideo ? "video" : "image",
      display_order: parseInt(sponsorOrder, 10) || 1,
      duration_sec: parseInt(sponsorDuration, 10) || 10,
      is_active: true
    }]);
    
    setUploadingSponsor(false);
    
    if (dbError) { 
      showStatus(`Erreur BD: ${dbError.message}`); 
    } else {
      showStatus("Média sponsor ajouté avec succès !");
      // On ne vide pas setSponsorFile(null) ni le champ pour "garder en cache pour les fois suivantes"
      setSponsorName("");
      setSponsorOrder((parseInt(sponsorOrder) + 1).toString());
      fetchData(); 
    }
  };

  const deleteSponsor = async (id: string) => {
    if (!window.confirm("Supprimer ce média sponsor ?")) return;
    const { error } = await supabase.from("sponsors").delete().eq("id", id);
    if (!error) { showStatus("Sponsor supprimé."); fetchData(); }
  };

  const editSponsorToggleActive = async (sponsor: any) => {
    const { error } = await supabase.from("sponsors").update({ is_active: !sponsor.is_active }).eq("id", sponsor.id);
    if (!error) fetchData();
  };

  const saveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSettings?.id) {
       // If settings row doesn't exist, create it.
       const { error } = await supabase.from("settings").insert([{
         carousel_interval_min: parseInt(settingBreakMin),
         carousel_duration_sec: parseInt(settingDelaySec)
       }]);
       if (!error) showStatus("Paramètres globaux créés.");
    } else {
       const { error } = await supabase.from("settings")
         .update({ 
           carousel_interval_min: parseInt(settingBreakMin),
           carousel_duration_sec: parseInt(settingDelaySec) 
         })
         .eq("id", globalSettings.id);
       if (!error) showStatus("Paramètres enregistrés avec succès !");
    }
    fetchData();
  };


  const filteredParticipants = participants.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredScoresHistory = scoresHistory.filter(s => 
    `${s.participants?.first_name} ${s.participants?.last_name}`.toLowerCase().includes(historySearchQuery.toLowerCase())
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
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#334155", margin: 0 }}>
          Dashboard Admin
        </h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={() => window.open("/", "_blank")} style={{
            padding: "0.6rem 1.2rem", background: "rgba(74,127,189,0.1)", color: "#4a7fbd",
            border: "1px solid rgba(74,127,189,0.2)", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem",
          }}>
            Vue Classique
          </button>
          <button onClick={handleLogout} style={{
            padding: "0.6rem 1.2rem", background: "rgba(239,68,68,0.06)", color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem",
          }}>
            Déconnexion
          </button>
        </div>
      </header>
      
      {/* Tab Switcher */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "center", marginTop: "2rem" }}>
        <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: "12px", padding: "0.4rem", display: "inline-flex", gap: "0.4rem", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
          <button onClick={() => setActiveTab('athletes')} style={{
            padding: "0.75rem 1.75rem", borderRadius: "8px", fontWeight: 700, fontSize: "1rem", cursor: "pointer", border: "none",
            background: activeTab === 'athletes' ? "white" : "transparent",
            color: activeTab === 'athletes' ? "#3b82f6" : "#64748b",
            boxShadow: activeTab === 'athletes' ? "0 2px 10px rgba(0,0,0,0.05)" : "none",
            transition: "all 0.2s"
          }}>
            Athlètes & Sauts
          </button>
          <button onClick={() => setActiveTab('sponsors')} style={{
            padding: "0.75rem 1.75rem", borderRadius: "8px", fontWeight: 700, fontSize: "1rem", cursor: "pointer", border: "none",
            background: activeTab === 'sponsors' ? "white" : "transparent",
            color: activeTab === 'sponsors' ? "#d94a8a" : "#64748b",
            boxShadow: activeTab === 'sponsors' ? "0 2px 10px rgba(0,0,0,0.05)" : "none",
            transition: "all 0.2s"
          }}>
            Médias & Sponsors
          </button>
          <button onClick={() => setActiveTab('avatars')} style={{
            padding: "0.75rem 1.75rem", borderRadius: "8px", fontWeight: 700, fontSize: "1rem", cursor: "pointer", border: "none",
            background: activeTab === 'avatars' ? "white" : "transparent",
            color: activeTab === 'avatars' ? "#10b981" : "#64748b",
            boxShadow: activeTab === 'avatars' ? "0 2px 10px rgba(0,0,0,0.05)" : "none",
            transition: "all 0.2s"
          }}>
            Bibliothèque d'Avatars
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1350px", margin: "0 auto", padding: "2rem 2.5rem", position: "relative", zIndex: 10 }}>

        {/* Status banner */}
        {statusMsg && (
          <div style={{
            padding: "1rem 1.5rem", borderRadius: "12px", marginBottom: "1.5rem", fontWeight: 700, fontSize: "1rem",
            background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.4)", color: "#16a34a",
            animation: "fadeIn 0.3s ease", display: "flex", alignItems: "center", gap: "10px"
          }}>
            ✓ {statusMsg}
          </div>
        )}

        {/* =========================================
            TAB: ATHLETES & SAUTS 
            ========================================= */}
        {activeTab === 'athletes' && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            
            {/* ── Profiles Management (Moved to top for fastest UX) ── */}
            <div style={{ ...cardStyle, marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>
                  Gestion des Profils
                </h2>
                <input
                  type="text" placeholder="Rechercher par nom..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ ...inputStyle, width: "260px", padding: "0.7rem 1rem", fontSize: "1rem" }}
                />
              </div>

              {/* Edit form */}
              {editingParticipant && (
                <form onSubmit={saveParticipantEdit} style={{
                  background: "rgba(74,127,189,0.06)", padding: "1.5rem", borderRadius: "12px",
                  border: "1px solid rgba(74,127,189,0.15)", display: "flex", flexWrap: "wrap", gap: "1rem",
                  alignItems: "center", marginBottom: "1.25rem",
                }}>
                  <strong style={{ width: "100%", color: "#334155", fontSize: "1rem" }}>Modifier le profil</strong>
                  <input type="text" value={editingParticipant.first_name} onChange={e => setEditingParticipant({...editingParticipant, first_name: e.target.value})} required style={{...inputStyle, flex: 1, minWidth: "120px"}} />
                  <input type="text" value={editingParticipant.last_name} onChange={e => setEditingParticipant({...editingParticipant, last_name: e.target.value})} required style={{...inputStyle, flex: 1, minWidth: "120px"}} />
                  <select value={editingParticipant.category} onChange={e => setEditingParticipant({...editingParticipant, category: e.target.value})} style={{...inputStyle, width: "auto", flex: "0 0 auto"}}>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                  <select value={editingParticipant.age_category || 'U18'} onChange={e => setEditingParticipant({...editingParticipant, age_category: e.target.value})} style={{...inputStyle, width: "auto", flex: "0 0 auto"}}>
                    {AGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  
                  {/* AJOUT GALERIE POUR SELECTIONNER AVATAR */}
                  <div style={{ width: "100%", marginTop: "0.5rem" }}>
                    <label style={{ display: "block", fontSize: "0.9rem", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Choisir un avatar depuis la bibliothèque</label>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", maxHeight: "150px", overflowY: "auto", padding: "10px", background: "rgba(255,255,255,0.5)", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.05)" }}>
                       <div 
                         onClick={() => setEditingParticipant({...editingParticipant, avatar_url: null})}
                         title="Aucun avatar"
                         style={{ flexShrink: 0, width: "45px", height: "45px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: !editingParticipant.avatar_url ? "3px solid #3b82f6" : "none" }}>
                         ❌
                       </div>
                       {galleryAvatars.map((file) => (
                         <img 
                           key={file.name}
                           src={getAvatarPublicUrl(file.name)}
                           alt={file.name}
                           onClick={() => setEditingParticipant({...editingParticipant, avatar_url: file.name})}
                           style={{ flexShrink: 0, width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover", cursor: "pointer", border: editingParticipant.avatar_url === file.name ? "3px solid #3b82f6" : "2px solid transparent", transition: "all 0.2s" }} 
                         />
                       ))}
                       {galleryAvatars.length === 0 && <span style={{ color: "#94a3b8", fontSize: "0.85rem", alignSelf: "center", fontStyle: "italic", marginLeft: "10px" }}>Aucun avatar dans la bibliothèque. Allez dans l'onglet Avatars !</span>}
                    </div>
                  </div>

                  <div style={{ width: "100%", display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button type="submit" style={{...btnPrimary, padding: "0.7rem 1.25rem", fontSize: "0.95rem"}}>Sauvegarder</button>
                    <button type="button" onClick={() => setEditingParticipant(null)} style={{ padding: "0.7rem 1.25rem", background: "transparent", color: "#64748b", border: "none", cursor: "pointer", fontSize: "0.95rem", fontWeight: 600 }}>Annuler</button>
                  </div>
                </form>
              )}

              {/* Participants table */}
              {filteredParticipants.length === 0 ? (
                <p style={{ color: "#94a3b8", fontStyle: "italic", textAlign: "center", padding: "2rem", fontSize: "1.1rem" }}>Aucun participant trouvé.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                    <thead>
                      <tr style={{ fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Athlète</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Catégorie</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipants.map((p, idx) => (
                        <tr key={p.id} style={{ background: idx % 2 === 0 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                          <td style={{ padding: "1rem", borderRadius: "10px 0 0 10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                              <Avatar name={p.first_name} gender={p.category} size={40} avatarUrl={p.avatar_url} />
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <strong style={{ color: "#1e293b", fontSize: "1.05rem" }}>{p.last_name} {p.first_name}</strong>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <span style={{
                              padding: "0.3rem 0.8rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 700,
                              background: (p.category === "Homme" || p.category === "H") ? "rgba(74,127,189,0.1)" : "rgba(189,74,127,0.1)",
                              color: (p.category === "Homme" || p.category === "H") ? "#4a7fbd" : "#bd4a7f",
                            }}>
                              {p.category === 'H' ? 'Homme' : p.category === 'F' ? 'Femme' : p.category}
                            </span>
                            <span style={{ marginLeft: "0.75rem", fontSize: "0.9rem", color: "#64748b", fontWeight: 700 }}>
                              {p.age_category || 'U18'}
                            </span>
                          </td>
                          <td style={{ padding: "1rem", textAlign: "right", borderRadius: "0 10px 10px 0" }}>
                            
                            {/* Inline Score UX */}
                            {inlineScoreParticipantId === p.id ? (
                              <form onSubmit={addScoreFromInlineForm} style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                                <input 
                                  type="number" step="1" placeholder="Saut en cm" required 
                                  value={inlineScoreValue} onChange={e => setInlineScoreValue(e.target.value)}
                                  autoFocus
                                  style={{ ...inputStyle, padding: "0.5rem 0.8rem", width: "130px", fontSize: "0.95rem", margin: 0 }} 
                                />
                                <button type="submit" style={btnSuccess}>Valider</button>
                                <button type="button" onClick={() => setInlineScoreParticipantId(null)} style={{ ...btnDanger, background: "transparent", border: "none" }}>Annuler</button>
                              </form>
                            ) : (
                              <>
                                {/* The magical Quick Score button */}
                                <button onClick={() => { setInlineScoreParticipantId(p.id); setInlineScoreValue(""); }} style={{...btnSuccess, background: "rgba(139,92,246,0.1)", color: "#7c3aed", border: "1px solid rgba(139,92,246,0.3)"}}>
                                  + Saut
                                </button>
                                <button onClick={() => setEditingParticipant(p)} style={btnEdit}>Éditer</button>
                                <button onClick={() => deleteParticipant(p.id, `${p.first_name} ${p.last_name}`)} style={btnDanger}>Suppr.</button>
                              </>
                            )}

                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Secondary Row: Add Participant ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", marginBottom: "2rem" }}>

              {/* Add Participant - FULL WIDTH */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b", margin: "0 0 1.25rem" }}>
                  Nouvel Athlète
                </h2>
                <form onSubmit={addParticipant} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <input type="text" placeholder="Prénom" value={firstName} onChange={e => setFirstName(e.target.value)} required style={inputStyle} />
                    <input type="text" placeholder="Nom" value={lastName} onChange={e => setLastName(e.target.value)} required style={inputStyle} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
            </div>

            {/* ── Scores History ── */}
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>
                  Historique des Sauts
                </h2>
                <input
                  type="text" placeholder="Rechercher par prénom..."
                  value={historySearchQuery} onChange={e => setHistorySearchQuery(e.target.value)}
                  style={{ ...inputStyle, width: "260px", padding: "0.7rem 1rem", fontSize: "1rem" }}
                />
              </div>
              
              {filteredScoresHistory.length === 0 ? (
                <p style={{ color: "#94a3b8", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>Aucun saut enregistré.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
                    <thead>
                      <tr style={{ fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Athlète</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Date & Heure</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Score</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScoresHistory.map((score, idx) => {
                        const dateObj = new Date(score.recorded_at);
                        const dateStr = dateObj.toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit' });
                        const timeStr = dateObj.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
                        return (
                          <tr key={score.id} style={{ background: idx % 2 === 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)", borderRadius: "8px" }}>
                            <td style={{ padding: "0.85rem 1rem", borderRadius: "8px 0 0 8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                <Avatar name={score.participants?.first_name || ""} gender={score.participants?.category || ""} size={32} />
                                <strong style={{ color: "#1e293b", fontSize: "0.95rem" }}>
                                  {score.participants?.first_name} {score.participants?.last_name}
                                </strong>
                              </div>
                            </td>
                            <td style={{ padding: "0.85rem 1rem", color: "#64748b", fontSize: "0.9rem", fontWeight: 500 }}>
                              {dateStr} à {timeStr}
                            </td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <span style={{ fontWeight: 800, color: "#7c3aed", fontSize: "1.1rem" }}>{score.value}</span>
                              <span style={{ color: "#94a3b8", fontSize: "0.85rem", marginLeft: "4px", fontWeight: 600 }}>cm</span>
                            </td>
                            <td style={{ padding: "0.85rem 1rem", textAlign: "right", borderRadius: "0 8px 8px 0" }}>
                              <button onClick={() => deleteScore(score.id)} style={{...btnDanger, padding: "0.4rem 0.8rem", fontSize: "0.8rem"}}>Supprimer</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
          </div>
        )}

        {/* =========================================
            TAB: SPONSORS & MEDIAS 
            ========================================= */}
        {activeTab === 'sponsors' && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            
            {/* Top row: Settings and New Upload */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
              
              {/* Global Settings */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b", margin: "0 0 1.25rem" }}>
                  Paramètres de Diffusion
                </h2>
                <form onSubmit={saveGlobalSettings} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.9rem", color: "#64748b", marginBottom: "6px", fontWeight: 600 }}>
                      Temps total sans publicité (Leaderboard visible)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input 
                        type="number" step="1" 
                        value={settingBreakMin} 
                        onChange={e => setSettingBreakMin(e.target.value)} 
                        style={inputStyle} 
                      />
                      <span style={{ color: "#1e293b", fontWeight: 600 }}>minutes</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.9rem", color: "#64748b", marginBottom: "6px", fontWeight: 600 }}>
                      Durée de transition entre médias sponsors
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input 
                        type="number" step="1" 
                        value={settingDelaySec} 
                        onChange={e => setSettingDelaySec(e.target.value)} 
                        style={inputStyle} 
                      />
                      <span style={{ color: "#1e293b", fontWeight: 600 }}>secondes</span>
                    </div>
                  </div>

                  <button type="submit" style={{ ...btnPurple, marginTop: "0.5rem" }}>Enregistrer les paramètres</button>
                </form>
              </div>

              {/* Add Sponsor File */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b", margin: "0 0 1.25rem" }}>
                  Ajouter un Média
                </h2>
                <form onSubmit={handleSponsorUpload} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <input
                    type="file"
                    accept="image/*,video/*,.gif"
                    required
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files ? e.target.files[0] : null;
                      setSponsorFile(file);
                      if (file && (file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm'))) {
                        const video = document.createElement('video');
                        video.preload = 'metadata';
                        video.onloadedmetadata = () => {
                          window.URL.revokeObjectURL(video.src);
                          setSponsorDuration(Math.round(video.duration).toString());
                        };
                        video.src = URL.createObjectURL(file);
                      }
                    }}
                    style={{ ...inputStyle, padding: "0.65rem 1.25rem" }}
                  />
                  <input 
                    type="text" 
                    placeholder="Nom interne du sponsor" 
                    value={sponsorName} 
                    onChange={e => setSponsorName(e.target.value)} 
                    required 
                    style={inputStyle} 
                  />
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "#64748b", marginBottom: "4px" }}>Ordre de passage</label>
                      <input 
                        type="number" step="1" 
                        value={sponsorOrder} 
                        onChange={e => setSponsorOrder(e.target.value)} 
                        required style={inputStyle} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "#64748b", marginBottom: "4px" }}>Durée de passage (sec)</label>
                      <input 
                        type="number" step="1" 
                        value={sponsorDuration} 
                        onChange={e => setSponsorDuration(e.target.value)} 
                        required style={inputStyle} 
                      />
                    </div>
                  </div>
                  
                  <button type="submit" disabled={uploadingSponsor} style={{ ...btnPrimary, background: uploadingSponsor ? "#cbd5e1" : btnPrimary.background }}>
                    {uploadingSponsor ? "Envoi en cours..." : "Uploader le média"}
                  </button>
                </form>
              </div>

            </div>

            {/* List of Sponsors */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1e293b", margin: "0 0 1.25rem" }}>
                Médias Programmés
              </h2>
              {sponsors.length === 0 ? (
                <p style={{ color: "#94a3b8", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>Aucun sponsor uploadé.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
                    <thead>
                      <tr style={{ fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "center", width: "80px" }}>Ordre</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Nom & Type</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Durée</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Statut</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sponsors.map((spo, idx) => (
                        <tr key={spo.id} style={{ background: idx % 2 === 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)", borderRadius: "8px" }}>
                          <td style={{ padding: "0.85rem 1rem", textAlign: "center", fontWeight: 800, color: "#4a7fbd", fontSize: "1.1rem", borderRadius: "8px 0 0 8px" }}>
                            {spo.display_order}
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                              {spo.media_type === "image" ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={spo.media_url} alt={spo.name} style={{ width: "50px", height: "35px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e2e8f0" }} />
                              ) : (
                                <div style={{ width: "50px", height: "35px", background: "#e2e8f0", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "#475569" }}>
                                  Video
                                </div>
                              )}
                              <div>
                                <strong style={{ color: "#1e293b", fontSize: "0.95rem", display: "block" }}>
                                  {spo.name}
                                </strong>
                                <a href={spo.media_url} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "#4a7fbd", textDecoration: "none" }}>Ouvrir le lien</a>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "0.85rem 1rem", textAlign: "center", fontWeight: 600, color: "#64748b" }}>
                            {spo.duration_sec} s
                          </td>
                          <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                            <button onClick={() => editSponsorToggleActive(spo)} style={{
                              padding: "0.3rem 0.6rem", borderRadius: "6px", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem", border: "none",
                              background: spo.is_active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                              color: spo.is_active ? "#16a34a" : "#ef4444"
                            }}>
                              {spo.is_active ? "Actif" : "Inactif"}
                            </button>
                          </td>
                          <td style={{ padding: "0.85rem 1rem", textAlign: "right", borderRadius: "0 8px 8px 0" }}>
                            <button onClick={() => deleteSponsor(spo.id)} style={{...btnDanger, padding: "0.4rem 0.8rem", fontSize: "0.8rem"}}>Supprimer</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* =========================================
            TAB: BIBLIOTHEQUE AVATARS 
            ========================================= */}
        {activeTab === 'avatars' && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            
            <div style={{ ...cardStyle, marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>
                  Bibliothèque Centrale d'Avatars
                </h2>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    ref={galleryFileInputRef}
                    onChange={handleGalleryUpload}
                  />
                  <button onClick={() => galleryFileInputRef.current?.click()} style={{ ...btnSuccess, background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                    + Ajouter une image (Générique)
                  </button>
                </div>
              </div>

              <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.5)", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.05)" }}>
                {galleryAvatars.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>La bibliothèque est vide. Uploadez des fichiers pour commencer.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "1rem" }}>
                    {galleryAvatars.map((file) => (
                      <div key={file.name} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                         <img 
                           src={getAvatarPublicUrl(file.name)}
                           alt={file.name}
                           style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "2px solid white" }} 
                         />
                         <button onClick={() => handleGalleryDelete(file.name)} style={{ background: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", fontSize: "0.7rem", padding: "0.2rem 0.6rem", cursor: "pointer" }}>
                           Supprimer
                         </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

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
