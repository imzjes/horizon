export default function HomePage() {
  return (
    <main
      style={{
        padding: "2rem 1.5rem",
        maxWidth: "960px",
        width: "100%",
        margin: "0 auto"
      }}
    >
      <section
        style={{
          borderRadius: "1.5rem",
          padding: "2.5rem 2rem",
          background:
            "linear-gradient(135deg, rgba(56,189,248,0.16), rgba(129,140,248,0.12))",
          border: "1px solid rgba(148,163,184,0.35)",
          boxShadow: "0 22px 45px rgba(15,23,42,0.75)"
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            lineHeight: 1.1,
            marginBottom: "1rem"
          }}
        >
          Horizon Prediction Market
        </h1>
        <p
          style={{
            fontSize: "1rem",
            maxWidth: "34rem",
            color: "rgba(226,232,240,0.85)",
            marginBottom: "1.75rem"
          }}
        >
          This is a minimal Next.js demo shell wired for deployment to Vercel.
          You can now connect it to your on-chain contracts and shared package.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}
        >
          <span
            style={{
              fontSize: "0.8rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              backgroundColor: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.6)"
            }}
          >
            Next.js 14
          </span>
          <span
            style={{
              fontSize: "0.8rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              backgroundColor: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.6)"
            }}
          >
            App Router
          </span>
          <span
            style={{
              fontSize: "0.8rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              backgroundColor: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.6)"
            }}
          >
            Ready for Vercel
          </span>
        </div>
      </section>
    </main>
  );
}


