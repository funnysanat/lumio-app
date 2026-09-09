import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

import { auth } from "@clerk/nextjs/server";
import ThemeSelector from "@/components/ThemeSelector";

export default async function SettingsPage() {
  const { getToken } = await auth();
  const token = await getToken();
  
  let childName = "Your Child";
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${API_URL}/api/v1/onboarding/child`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      childName = data.child?.first_name || childName;
    }
  } catch (err) {
    console.error(err);
  }

  return (
    <div>
      <header className="header">
        <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="14" width="8" height="8" rx="2.5" fill="#38bdf8" />
            <rect x="13" y="14" width="8" height="8" rx="2.5" fill="#a78bfa" />
            <rect x="8" y="5" width="8" height="8" rx="2.5" fill="#f472b6" />
          </svg>
          Lumio AI
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Dashboard</Link>
          <UserButton />
        </div>
      </header>

      <main className="page-wrapper container-sm animate-fade-in">
        <h1 style={{ marginBottom: '2rem' }}>Settings</h1>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#a1a1aa', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Subscription
          </h2>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>Core Plan (14-Day Free Trial)</h3>
                <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.875rem' }}>Trial ends in 12 days</p>
              </div>
              <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>Active</span>
            </div>
            <button className="btn btn-outline" style={{ marginTop: '1.5rem', width: '100%' }}>Manage Subscription</button>
          </div>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#a1a1aa', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Child Profile
          </h2>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{childName}</h3>
              <Link href="/onboarding/child" style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>Update Profile & Milestones</Link>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderTop: '1px solid var(--border)' }}>
              <span>Therapy Goals (2 Active)</span>
              <Link href="/onboarding/goals" style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>Manage</Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0 0 0', borderTop: '1px solid var(--border)' }}>
              <span>Interests & Rewards</span>
              <Link href="/onboarding/interests" style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>Manage</Link>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#a1a1aa', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Notifications
          </h2>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>Daily Practice Reminder</h4>
                <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.875rem' }}>Gentle nudge to practice today</p>
              </div>
              <input type="checkbox" defaultChecked style={{ transform: 'scale(1.5)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>Weekly Report</h4>
                <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.875rem' }}>Summary sent on Sunday evening</p>
              </div>
              <input type="checkbox" defaultChecked style={{ transform: 'scale(1.5)' }} />
            </div>
          </div>
        </section>
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#a1a1aa', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            App Theme
          </h2>
          <div className="card">
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--foreground)' }}>Choose Your Favorite Color Palette</h4>
            <ThemeSelector />
          </div>
        </section>
        
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <button className="btn" style={{ color: '#f87171', backgroundColor: 'transparent', fontSize: '0.875rem' }}>
            Sign Out completely
          </button>
        </div>
      </main>
    </div>
  );
}
