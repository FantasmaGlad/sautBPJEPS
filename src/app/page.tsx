export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        margin: 0,
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        color: "#ffffff",
        overflow: "hidden",
        position: "relative",
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

      {/* Card */}
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
          Déploiement OK
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
          Compétition BPJEPS — Saut en longueur
        </p>

        {/* Tech pills */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {["Next.js 14", "Supabase", "Vercel"].map((tech) => (
            <span
              key={tech}
              style={{
                padding: "6px 16px",
                borderRadius: "100px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "0.8rem",
                color: "rgba(255, 255, 255, 0.6)",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p
        style={{
          position: "absolute",
          bottom: "2rem",
          fontSize: "0.8rem",
          color: "rgba(255, 255, 255, 0.25)",
          fontWeight: 400,
          letterSpacing: "0.04em",
        }}
      >
        Page de test • Pipeline fonctionnel ✓
      </p>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </main>
  );
}
