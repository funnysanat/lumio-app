"use client";

import { useEffect, useState } from "react";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GeneratePlanButton from '@/components/GeneratePlanButton';
import { UI_STRINGS } from '@/utils/i18n';
import { useAppStore } from '@/store/useAppStore';

export default function DashboardPage() {
  const { userId, getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  
  const firstName = user?.firstName || "Parent";

  const { plan: cachedPlan, snapshot: cachedSnapshot, setPlan, setSnapshot } = useAppStore();
  
  const [loading, setLoading] = useState(!cachedPlan);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userId === null) {
      router.push("/sign-in");
      return;
    }

    async function loadData() {
      try {
        const token = await getToken();
        if (!token) return;
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // Fetch Plan
        try {
          const res = await fetch(`${API_URL}/api/v1/dashboard/plan`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
          });
          
          if (res.ok) {
            const data = await res.json();
            setPlan({
              id: 'daily',
              mode: data.mode || "creative",
              plan_date: new Date().toISOString(),
              activities: data.activities || []
            });
          } else if (res.status === 404) {
            router.push("/onboarding");
          } else {
            // Only set error if we don't have a cached plan
            if (!cachedPlan) setErrorMsg("Failed to load your daily plan.");
          }
        } catch (err) {
          console.error(err);
          if (!cachedPlan) setErrorMsg("Could not connect to server. Working offline.");
        }

        // Fetch Snapshot
        try {
          const snapshotRes = await fetch(`${API_URL}/api/v1/onboarding/assessment`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
          });
          if (snapshotRes.ok) {
            const data = await snapshotRes.json();
            if (data.snapshot) setSnapshot(data.snapshot);
          }
        } catch (err) {
          console.error("Could not fetch assessment", err);
        }

      } finally {
        setLoading(false);
      }
    }

    if (userId) loadData();
  }, [userId, getToken, router, setPlan, setSnapshot, cachedPlan]);

  const dailyPlan = cachedPlan?.activities || [];
  const planMode = cachedPlan?.mode || "creative";
  const latestSnapshot = cachedSnapshot;

  const langCode = (dailyPlan.length > 0 ? dailyPlan[0].category : 'en-US')?.split('-')[0] || 'en';
  const t = UI_STRINGS[langCode] || UI_STRINGS['en'];

  const hour = new Date().getHours();
  let greeting = "Good Morning";
  if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
  else if (hour >= 17) greeting = "Good Evening";

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
      
      <main className="page-wrapper container-lg animate-fade-in">
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

        {/* Developmental Milestones Card */}
        <div className="card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Developmental Milestones (DEALL)</h3>
            {latestSnapshot ? (
              <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.875rem' }}>
                Last assessed: {new Date(latestSnapshot.assessment_date).toLocaleDateString()} | Chronological Age: {latestSnapshot.chronological_age_months} months
              </p>
            ) : (
              <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.875rem' }}>
                Take the milestone check-in to get highly targeted micro-niche activities.
              </p>
            )}
          </div>
          <Link href="/onboarding/child" className="btn" style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none' }}>
            {latestSnapshot ? 'Update Check-In' : 'Take Check-In'}
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#a1a1aa' }}>Loading your plan...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {dailyPlan.map((activity: any, idx: number) => (
              <div key={activity.id} className="activity-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flexGrow: 1 }}>
                  <span className="badge">{activity.goal}</span>
                  <h2 style={{ margin: '0.5rem 0', fontSize: '1.25rem', lineHeight: '1.4' }}>{activity.title}</h2>
                  <div style={{ display: 'flex', gap: '1rem', color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <span>⏱ {activity.duration}</span>
                    <span>📊 {activity.difficulty}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', fontStyle: 'italic', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                    ✨ {activity.reason}
                  </p>
                </div>
                <div style={{ width: '100%', marginTop: 'auto' }}>
                  <Link href={`/session/${activity.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                    {idx === 0 ? t.startNow : t.start}
                  </Link>
                </div>
              </div>
            ))}
            
            {!errorMsg && dailyPlan.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#a1a1aa' }}>
                <p>Your plan is being generated. Please refresh in a moment.</p>
              </div>
            )}
          </div>
        )}

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
