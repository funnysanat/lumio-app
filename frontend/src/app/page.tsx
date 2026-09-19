import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function Home() {
  const { userId } = await auth();

  return (
    <>
      <header className="header">
        <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="14" width="8" height="8" rx="2.5" fill="#38bdf8" />
            <rect x="13" y="14" width="8" height="8" rx="2.5" fill="#a78bfa" />
            <rect x="8" y="5" width="8" height="8" rx="2.5" fill="#f472b6" />
          </svg>
          Lumio AI
        </Link>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/therapist/join" style={{ fontSize: "0.9rem", color: "var(--muted-foreground)", textDecoration: "none", fontWeight: 500 }}>
            For Therapists
          </Link>
          {userId ? (
            <UserButton />
          ) : (
            <Link href="/sign-in" className="btn btn-outline">
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="hero animate-fade-in">
        <div className="container">
          <h1 style={{ fontSize: '3.5rem', lineHeight: '1.2', marginBottom: '1.5rem' }}>
            Helping Moms Connect & <br /> Communicate
          </h1>
          <p style={{ maxWidth: '750px', margin: '0 auto 2.5rem auto', fontSize: '1.25rem', lineHeight: '1.6' }}>
            Lumio AI is your daily companion. We bridge the gap between therapy sessions by bringing expert-inspired, play-based strategies into your living room. Empower yourself to help your child communicate better every day.
          </p>
          <div className="hero-actions">
            {userId ? (
              <Link href="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <Link href="/sign-up" className="btn btn-primary">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
