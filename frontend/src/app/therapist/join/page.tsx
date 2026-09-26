"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function TherapistJoinPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--background)", padding: "2rem" }}>
      {/* Navigation Header */}
      <div style={{ position: "absolute", top: "1.5rem", left: "2rem", right: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="14" width="8" height="8" rx="2.5" fill="#38bdf8" />
            <rect x="13" y="14" width="8" height="8" rx="2.5" fill="#a78bfa" />
            <rect x="8" y="5" width="8" height="8" rx="2.5" fill="#f472b6" />
          </svg>
          <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--foreground)" }}>Lumio AI</span>
        </Link>
        <Link href="/dashboard" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.875rem", textDecoration: "none" }}>
          ← Back to Dashboard
        </Link>
      </div>

      {/* Hero Content */}
      <div style={{ marginBottom: "2.5rem", textAlign: "center", marginTop: "4rem" }}>

        <div style={{
          display: "inline-block",
          background: "linear-gradient(135deg, rgba(56,189,248,0.12), rgba(167,139,250,0.12))",
          border: "1px solid rgba(167,139,250,0.25)",
          borderRadius: "2rem",
          padding: "0.4rem 1.2rem",
          marginBottom: "1rem",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "#a78bfa",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}>
          Therapist Portal
        </div>

        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem 0", lineHeight: 1.2 }}>
          Join Lumio as a Therapist
        </h1>
        <p style={{ color: "var(--muted-foreground)", margin: 0, maxWidth: "420px", lineHeight: 1.6 }}>
          Get discovered by families looking for specialists like you. Build your digital practice and manage bookings in one place.
        </p>
      </div>

      {/* Benefits strip */}
      <div style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: "2rem",
        maxWidth: "520px",
      }}>
        {[
          { icon: "🔍", label: "Get discovered by 1,000+ families" },
          { icon: "📅", label: "Zero-admin booking management" },
          { icon: "✨", label: "AI session summaries" },
        ].map((b) => (
          <div key={b.label} style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "2rem",
            padding: "0.5rem 1rem",
            fontSize: "0.82rem",
            color: "var(--muted-foreground)",
          }}>
            <span>{b.icon}</span>
            <span>{b.label}</span>
          </div>
        ))}
      </div>

      {/* Clerk Sign-In / Sign-Up widget */}
      <SignIn
        routing="hash"
        fallbackRedirectUrl="/therapist/onboarding"
        forceRedirectUrl="/therapist/onboarding"
        appearance={{
          elements: {
            card: {
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "1rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            },
          },
        }}
      />

      <p style={{ marginTop: "1.5rem", color: "var(--muted-foreground)", fontSize: "0.82rem", textAlign: "center" }}>
        Looking to find a therapist for your child?{" "}
        <Link href="/sign-in" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
          Parent sign in →
        </Link>
      </p>
    </div>
  );
}
