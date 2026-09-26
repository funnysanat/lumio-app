import { redirect } from "next/navigation";
import { getUserRole } from "@/utils/authRole";
import Link from "next/link";

export default async function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();

  if (role === "therapist") {
    redirect("/therapist/dashboard");
  } else if (role === null) {
    redirect("/onboarding");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "64px",
          backgroundColor: "var(--card-bg)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 1.5rem",
          zIndex: 50,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          justifyContent: "space-between"
        }}
      >
        <Link 
          href="/dashboard" 
          className="btn btn-outline" 
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.875rem", textDecoration: "none" }}
        >
          ← Back to Dashboard
        </Link>
        <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--foreground)", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          Therapist Marketplace
        </h1>
        <div style={{ width: "150px", display: "flex", justifyContent: "flex-end" }}>
          <Link href="/pricing" style={{ 
            color: 'white', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
            background: 'linear-gradient(135deg, #38bdf8 0%, #a78bfa 100%)', 
            padding: '0.4rem 0.8rem', borderRadius: '1rem' 
          }}>
            Upgrade
          </Link>
        </div>
      </header>
      <main style={{ flex: 1, paddingTop: "64px" }}>
        {children}
      </main>
    </div>
  );
}
