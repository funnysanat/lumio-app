import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserRole } from "@/utils/authRole";

export default async function OnboardingRoot() {
  const role = await getUserRole();

  // If they somehow already have a role, send them to their dashboard
  if (role === "parent") {
    redirect("/dashboard");
  } else if (role === "therapist") {
    redirect("/therapist/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--background)", padding: "2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 1rem 0", color: "var(--foreground)" }}>
          Welcome to Lumio!
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: "1.1rem", maxWidth: "400px", margin: "0 auto" }}>
          How would you like to use the platform?
        </p>
      </div>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "center", maxWidth: "800px" }}>

        {/* Parent Option */}
        <Link href="/onboarding/child" style={{ textDecoration: "none" }}>
          <div className="role-card" style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "1.5rem",
            padding: "2.5rem 2rem",
            width: "300px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>👨‍👩‍👦</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "var(--foreground)" }}>I am a Parent</h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>
              I want to track my child's progress, get AI-powered daily activities, and connect with therapists.
            </p>
          </div>
        </Link>

        {/* Therapist Option */}
        <Link href="/therapist/onboarding" style={{ textDecoration: "none" }}>
          <div className="role-card" style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "1.5rem",
            padding: "2.5rem 2rem",
            width: "300px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>👩🏽‍⚕️</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "var(--foreground)" }}>I am a Therapist</h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>
              I want to list my practice, manage bookings, and get AI-generated session notes.
            </p>
          </div>
        </Link>

      </div>
    </div>
  );
}
