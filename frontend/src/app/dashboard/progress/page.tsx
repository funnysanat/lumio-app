import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

type GoalData = {
  id: string;
  name: string;
  this_week: number;
  last_week: number;
  ai_suggestion: string;
};

type Milestone = {
  text: string;
  date: string;
};

export default async function ProgressPage() {
  const { getToken } = await auth();
  const token = await getToken();
  
  let childName = "Your Child";
  let goals: GoalData[] = [];
  let milestones: Milestone[] = [];
  
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
    
    // Fetch progress data
    const progressRes = await fetch(`${API_URL}/api/v1/dashboard/progress`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    if (progressRes.ok) {
      const progressData = await progressRes.json();
      goals = progressData.goals || [];
      milestones = progressData.milestones || [];
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

      <main className="container animate-fade-in" style={{ paddingTop: '100px', maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0 }}>Progress Tracking</h1>
            <p style={{ color: '#a1a1aa', margin: '0.5rem 0 0 0' }}>See how {childName} is developing over time.</p>
          </div>
        </div>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Active Goals</h2>
          
          {goals.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ color: '#a1a1aa' }}>No goals found. Complete onboarding to start tracking progress.</p>
            </div>
          ) : (
            goals.map((goal, index) => {
              // Determine trend color and arrow
              let trendColor = '#facc15'; // Yellow for steady
              let arrow = '→';
              if (goal.this_week > goal.last_week) {
                trendColor = '#4ade80'; // Green for up
                arrow = '↑';
              } else if (goal.this_week < goal.last_week) {
                trendColor = '#f87171'; // Red for down
                arrow = '↓';
              }
              
              // Colors array to cycle border colors
              const colors = ['#4ade80', '#facc15', '#60a5fa', '#c084fc'];
              const borderColor = colors[index % colors.length];

              return (
                <div key={goal.id} className="card" style={{ marginBottom: '1rem', borderLeft: `4px solid ${borderColor}` }}>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{goal.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#a1a1aa', margin: 0 }}>Independent responses this week vs last week</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{goal.last_week} → {goal.this_week}</span>
                      <span style={{ color: trendColor, fontSize: '1.5rem' }}>{arrow}</span>
                    </div>
                  </div>
                  
                  {/* AI Suggestion */}
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#e2e8f0', lineHeight: 1.5 }}>
                      💡 <strong>AI Insight:</strong> {goal.ai_suggestion}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Milestones</h2>
          {milestones.length === 0 ? (
            <p style={{ color: '#a1a1aa' }}>No recent milestones. Keep practicing!</p>
          ) : (
            milestones.map((milestone, idx) => {
              const dateStr = new Date(milestone.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              return (
                <div key={idx} className="card" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', marginBottom: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#d8b4fe' }}>🎉 Milestone Reached!</h3>
                  <p style={{ margin: 0, color: '#e9d5ff' }}>
                    {milestone.text}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#a1a1aa' }}>{dateStr}</p>
                </div>
              );
            })
          )}
        </section>

      </main>
    </div>
  );
}
