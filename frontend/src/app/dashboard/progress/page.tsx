import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import SessionHistory from "./SessionHistory";
import VisualRoadmap from "./VisualRoadmap";
import JourneyRoadmap from "./JourneyRoadmap";


type SessionInfo = {
  id: string;
  activity_name: string;
  response: string;
  text_note: string | null;
  voice_note_url: string | null;
  time: string;
};

type HistoryData = {
  date: string;
  sessions: SessionInfo[];
  total_completed: number;
  independent_count: number;
};

export default async function ProgressPage() {
  const { getToken } = await auth();
  const token = await getToken();
  
  let childName = "Your Child";
  let history: HistoryData[] = [];
  
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Fetch child profile
    const childRes = await fetch(`${API_URL}/api/v1/onboarding/child`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    if (childRes.ok) {
      const data = await childRes.json();
      childName = data.child?.first_name || childName;
    }

    // Fetch session history
    const historyRes = await fetch(`${API_URL}/api/v1/dashboard/progress/history`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    if (historyRes.ok) {
      const historyData = await historyRes.json();
      history = historyData.history || [];
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
          <Link href="/settings" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Settings</Link>
          <UserButton />
        </div>
      </header>

      <main className="page-wrapper container-lg animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0 }}>Progress Tracking</h1>
            <p style={{ color: '#a1a1aa', margin: '0.5rem 0 0 0' }}>See how {childName} is developing over time.</p>
          </div>
        </div>

        <section style={{ marginBottom: '3rem' }}>
          <JourneyRoadmap />
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Developmental Snapshot</h2>
          <VisualRoadmap />
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Session History</h2>
          <SessionHistory history={history} />
        </section>

      </main>
    </div>
  );
}
