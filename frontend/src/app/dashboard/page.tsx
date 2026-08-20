import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import GeneratePlanButton from '@/components/GeneratePlanButton';
import { UI_STRINGS } from '@/utils/i18n';

export default async function DashboardPage() {
  const { userId, getToken } = await auth();
  const user = await currentUser();
  const firstName = user?.firstName || "Parent";

  if (!userId) {
    redirect("/sign-in");
  }

  const token = await getToken();
  
  let dailyPlan = [];
  let planMode = "creative";
  let errorMsg = null;
  let needsOnboarding = false;
  
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${API_URL}/api/v1/dashboard/plan`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store' // Always fetch fresh plan
    });
    
    if (res.ok) {
      const data = await res.json();
      dailyPlan = data.activities || [];
      planMode = data.mode || "creative";
    } else if (res.status === 404) {
      // Child profile not found, needs onboarding
      needsOnboarding = true;
    } else {
      errorMsg = "Failed to load your daily plan.";
    }
  } catch (err) {
    console.error(err);
    errorMsg = "Could not connect to server.";
  }

  if (needsOnboarding) {
    redirect("/onboarding");
  }

  const langCode = (dailyPlan.length > 0 ? dailyPlan[0].audio_lang_code : 'en-US')?.split('-')[0] || 'en';
  const t = UI_STRINGS[langCode] || UI_STRINGS['en'];

  const hour = new Date().getHours();
  let greeting = "Good Morning";
  if (hour >= 12 && hour < 17) {
    greeting = "Good Afternoon";
  } else if (hour >= 17) {
    greeting = "Good Evening";
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
          <Link href="/dashboard/progress" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Progress</Link>
          <Link href="/settings" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Settings</Link>
          <UserButton />
        </div>
      </header>
      
      <main className="container animate-fade-in" style={{ paddingTop: '100px', maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0 }}>{greeting}, {firstName}!</h1>
            <p style={{ color: '#a1a1aa', margin: '0.5rem 0 0 0' }}>Here is the personalised plan for today.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <p style={{ fontWeight: 600, color: 'var(--primary)', margin: 0 }}>Today</p>
            {dailyPlan.length > 0 && (
              <span className="badge" style={{ backgroundColor: planMode === 'standard' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(167, 139, 250, 0.1)', color: planMode === 'standard' ? '#38bdf8' : '#a78bfa', borderColor: planMode === 'standard' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(167, 139, 250, 0.2)' }}>
                {planMode === 'standard' ? '🏥 Standard Therapy' : '✨ Creative AI'}
              </span>
            )}
          </div>
        </div>

        {errorMsg && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '0.5rem', marginBottom: '2rem' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {dailyPlan.map((activity: any, idx: number) => (
            <div key={activity.id} className="activity-card">
              <div>
                <span className="badge">{activity.goal}</span>
                <h2 style={{ margin: '0.25rem 0', fontSize: '1.25rem' }}>{activity.title}</h2>
                <div style={{ display: 'flex', gap: '1rem', color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  <span>⏱ {activity.duration}</span>
                  <span>📊 {activity.difficulty}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#d8b4fe', fontStyle: 'italic' }}>
                  ✨ {activity.reason}
                </p>
              </div>
              <div>
                <Link href={`/session/${activity.id}`} className="btn btn-primary">
                  {idx === 0 ? t.startNow : t.start}
                </Link>
              </div>
            </div>
          ))}
          
          {!errorMsg && dailyPlan.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#a1a1aa' }}>
              <p>Your plan is being generated. Please refresh in a moment.</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--foreground)' }}>Generate a new plan</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <GeneratePlanButton 
              mode="standard" 
              buttonText="🏥 Standard Therapy Activities" 
              designingText="Loading Standard Plan..." 
            />
            <GeneratePlanButton 
              mode="creative" 
              buttonText="✨ Creative AI Activities" 
              designingText="Designing Creative Plan..." 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
