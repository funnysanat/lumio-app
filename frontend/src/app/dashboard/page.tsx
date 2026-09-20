"use client";

import { useEffect, useState } from "react";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UI_STRINGS } from '@/utils/i18n';
import { useAppStore } from '@/store/useAppStore';

function NotificationBell() {
  const { getToken } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/v1/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchNotifs();
  }, [getToken]);

  return (
    <Link href="/dashboard/feed" style={{ position: 'relative', cursor: 'pointer', textDecoration: 'none' }}>
      <div style={{ fontSize: '1.25rem' }}>🔔</div>
      {unreadCount > 0 && (
        <span style={{ 
          position: 'absolute', top: '-5px', right: '-5px', 
          background: '#ef4444', color: 'white', fontSize: '0.6rem', 
          fontWeight: 'bold', width: '16px', height: '16px', 
          borderRadius: '50%', display: 'flex', alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

export default function DashboardPage() {
  const { userId, getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  
  const firstName = user?.firstName || "Parent";

  const { plan: cachedPlan, snapshot: cachedSnapshot, setPlan, setSnapshot } = useAppStore();
  
  const [videos, setVideos] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(!cachedPlan);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
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
            // Do not force redirect to onboarding. Allow them to explore the marketplace.
            // The UI already encourages them to complete the check-in.
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

        // Fetch Trending Videos
        try {
          const vidRes = await fetch(`${API_URL}/api/v1/videos`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (vidRes.ok) {
            const data = await vidRes.json();
            setVideos(data.slice(0, 10)); // Top 10 for carousel
          }
        } catch (err) {
          console.error("Could not fetch videos", err);
        }

        // Fetch Upcoming Sessions
        try {
          const [bookRes, enrollRes] = await Promise.all([
            fetch(`${API_URL}/api/v1/marketplace/bookings/my-bookings`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/api/v1/marketplace/group-sessions/my-enrollments`, { headers: { 'Authorization': `Bearer ${token}` } })
          ]);
          if (bookRes.ok) setMyBookings(await bookRes.json());
          if (enrollRes.ok) setMyEnrollments(await enrollRes.json());
        } catch (err) {
          console.error("Could not fetch sessions", err);
        }
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
  }, [userId, getToken, router, setPlan, setSnapshot]);

  const dailyPlan = cachedPlan?.activities || [];
  const planMode = cachedPlan?.mode || "creative";
  const latestSnapshot = cachedSnapshot;

  const langCode = (dailyPlan.length > 0 ? dailyPlan[0].category : 'en-US')?.split('-')[0] || 'en';
  const t = UI_STRINGS[langCode] || UI_STRINGS['en'];

  const hour = new Date().getHours();
  let greeting = "Good Morning";
  if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
  else if (hour >= 17) greeting = "Good Evening";

  if (!hasMounted) return null;

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
          <Link href="/dashboard/feed" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Therapy Videos</Link>
          <Link href="/dashboard/progress" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Progress</Link>
          <Link href="/settings" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Settings</Link>
          
          <div style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NotificationBell />
          </div>
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

        {/* Upcoming Sessions Section */}
        {(myBookings.length > 0 || myEnrollments.length > 0) && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              My Upcoming Sessions
              <Link href="/marketplace/workshops" style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              
              {myBookings.map((b: any) => (
                <div key={b.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
                  <div style={{ background: 'var(--primary)', color: 'white', minWidth: '3rem', width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                    {b.mode === 'online' ? '📹' : '🏢'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>1:1 {b.session_type === 'child_therapy' ? 'Therapy' : 'Consultation'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                      {b.scheduled_date} at {b.scheduled_time} ({b.duration_mins}m)
                    </div>
                  </div>
                  <div style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize', background: b.status === 'confirmed' ? 'rgba(34,197,94,0.1)' : 'var(--border)', color: b.status === 'confirmed' ? '#22c55e' : 'var(--muted-foreground)' }}>
                    {b.status}
                  </div>
                </div>
              ))}

              {myEnrollments.map((e: any) => (
                <div key={e.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
                  <div style={{ background: '#a78bfa', color: 'white', minWidth: '3rem', width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                    👥
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.group_session?.title || 'Group Workshop'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                      {e.group_session?.scheduled_date} at {e.group_session?.scheduled_time}
                    </div>
                  </div>
                  <div style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize', background: e.status === 'confirmed' ? 'rgba(34,197,94,0.1)' : 'var(--border)', color: e.status === 'confirmed' ? '#22c55e' : 'var(--muted-foreground)' }}>
                    {e.status}
                  </div>
                </div>
              ))}
              
            </div>
          </div>
        )}

        {/* Trending Therapy Videos Carousel */}
        {videos.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Trending Therapy Videos</h2>
              <Link href="/dashboard/feed" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>View All →</Link>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              overflowX: 'auto', 
              paddingBottom: '1rem',
              scrollbarWidth: 'none', // Firefox
              WebkitOverflowScrolling: 'touch' 
            }}
            className="hide-scrollbar"
            >
              {videos.map((vid: any, i: number) => {
                const dummyImages = [
                  "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=400&q=80", // Child building blocks
                  "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&q=80", // Therapist interacting
                  "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&q=80", // Child smiling
                  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80", // Yoga/stretching
                  "https://images.unsplash.com/photo-1588514757134-8025ab447fa0?w=400&q=80"  // Art therapy
                ];
                const bgImage = dummyImages[i % dummyImages.length];
                
                return (
                <Link key={vid.id} href={`/dashboard/feed`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    minWidth: '220px',
                    width: '220px',
                    height: '320px',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '1rem',
                    color: 'white'
                  }}>
                    {/* Play Button Overlay */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.3)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    
                    <div style={{ position: 'relative', zIndex: 10, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)', margin: '-1rem', padding: '2rem 1rem 1rem 1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{vid.title}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.5rem' }}>{vid.therapist?.full_name || 'Therapist'}</div>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        <span>👁️ {vid.views_count || 0}</span>
                        <span>❤️ {vid.likes_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
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

        {/* Marketplace CTAs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Find a Therapist */}
          <Link href="/marketplace" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(56,189,248,0.08) 100%)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '1rem',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              height: '100%',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(99,102,241,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.25)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>🔍</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem', color: 'var(--foreground)' }}>Find a Therapist</div>
                  <div style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
                    Discover verified specialists matched to your child
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 700, fontSize: '0.87rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                Browse →
              </div>
            </div>
          </Link>

          {/* Explore Workshops */}
          <Link href="/marketplace/workshops" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(236,72,153,0.08) 100%)',
              border: '1px solid rgba(167,139,250,0.25)',
              borderRadius: '1rem',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              height: '100%',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#a78bfa'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(167,139,250,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(167,139,250,0.25)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>🎟️</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem', color: 'var(--foreground)' }}>Join Workshops</div>
                  <div style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
                    Attend live group sessions and caregiver training
                  </div>
                </div>
              </div>
              <div style={{ background: '#a78bfa', color: 'white', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 700, fontSize: '0.87rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                View Events →
              </div>
            </div>
          </Link>

          {/* Ask a Therapist */}
          <Link href="/dashboard/ask" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(56,189,248,0.08) 100%)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '1rem',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              height: '100%',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#22c55e'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(34,197,94,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(34,197,94,0.25)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>💬</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem', color: 'var(--foreground)' }}>Ask a Therapist</div>
                  <div style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
                    Get fast answers to specific questions for ₹199
                  </div>
                </div>
              </div>
              <div style={{ background: '#22c55e', color: 'white', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 700, fontSize: '0.87rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                Ask →
              </div>
            </div>
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
                {latestSnapshot ? (
                  <p>Your plan is being generated. Please refresh in a moment.</p>
                ) : (
                  <div>
                    <p style={{ marginBottom: "1rem" }}>Complete your child&apos;s profile to get a personalized daily plan.</p>
                    <Link href="/onboarding" className="btn btn-primary" style={{ display: "inline-block" }}>Start Onboarding</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
