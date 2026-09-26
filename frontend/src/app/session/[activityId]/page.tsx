"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from "@clerk/nextjs";

import { UI_STRINGS } from '@/utils/i18n';
import InteractiveGame from '@/components/InteractiveGame';

const SessionHeader = ({ children }: { children?: React.ReactNode }) => (
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
      onClick={() => window.speechSynthesis.cancel()}
      style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.875rem", textDecoration: "none" }}
    >
      ← Back to Dashboard
    </Link>
    <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--foreground)", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
      Activity Session
    </h1>
    <div style={{ width: "200px", display: "flex", justifyContent: "flex-end" }}>{children}</div>
  </header>
);

export default function SessionPage({ params }: { params: Promise<{ activityId: string }> }) {
  const resolvedParams = use(params);
  const activityId = resolvedParams.activityId;
  const router = useRouter();
  const { getToken } = useAuth();
  
  const searchParams = useSearchParams();
  const role = searchParams.get('role'); // 'parent', 'child', or null

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [engagementMode, setEngagementMode] = useState<'game' | 'music'>('game');
  const [showQR, setShowQR] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<string>('');

  // WebSocket Connection
  useEffect(() => {
    if (!role) return;
    const wsUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('http', 'ws') 
      : 'ws://localhost:8000';
    const socket = new WebSocket(`${wsUrl}/api/v1/ws/session/${activityId}`);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'STATE_CHANGE') setSessionState(data.payload);
        else if (data.type === 'ENGAGEMENT_MODE') setEngagementMode(data.payload);
      } catch (e) {}
    };
    setWs(socket);
    return () => socket.close();
  }, [activityId, role]);

  const updateSessionState = (newState: 'prep' | 'active' | 'logging') => {
    setSessionState(newState);
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'STATE_CHANGE', payload: newState }));
  };
  const updateEngagementMode = (mode: 'game' | 'music') => {
    setEngagementMode(mode);
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ENGAGEMENT_MODE', payload: mode }));
  };

  const [viewMode, setViewMode] = useState<'split' | 'parent' | 'child'>('split');
  const [sessionState, setSessionState] = useState<'prep' | 'active' | 'logging'>('prep');
  
  const [responseType, setResponseType] = useState<string>('');
  
  // Activity Data State
  const [showStruggleTips, setShowStruggleTips] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [textNote, setTextNote] = useState<string>('');
  
  // Activity Data State
  const [activity, setActivity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track domain
  const [domain, setDomain] = useState<'aba' | 'ot_pt' | 'speech' | 'sped'>('aba');

  // Auto-detect domain when activity loads
  useEffect(() => {
    if (activity) {
      const q = (activity.video_search_query || activity.goal || '').toLowerCase();
      if (q.includes('speech') || q.includes('language') || q.includes('say') || q.includes('word') || q.includes('articulation')) setDomain('speech');
      else if (q.includes('occupational') || q.includes('fine motor') || q.includes('gross motor') || q.includes('ot') || q.includes('physical') || q.includes('pt')) setDomain('ot_pt');
      else if (q.includes('special ed') || q.includes('academic') || q.includes('math') || q.includes('reading') || q.includes('school')) setDomain('sped');
      else setDomain('aba');
    }
  }, [activity]);

  const DOMAIN_PROMPTS = {
    aba: [
      { label: "Independent", value: "independent", desc: "Completed without any help" },
      { label: "Gestural Prompt", value: "gestural", desc: "Pointed or gestured to guide them" },
      { label: "Verbal Prompt", value: "verbal", desc: "Gave a verbal hint or instruction" },
      { label: "Physical Prompt", value: "physical", desc: "Guided them physically (hand-over-hand)" },
      { label: "No Response / Refused", value: "refused", desc: "Did not attempt the activity" }
    ],
    ot_pt: [
      { label: "Independent", value: "independent", desc: "No physical assistance needed" },
      { label: "Supervision", value: "supervision", desc: "Required standby supervision or cues" },
      { label: "Minimal Assist", value: "min_assist", desc: "Child did >75% of the work" },
      { label: "Moderate Assist", value: "mod_assist", desc: "Child did ~50% of the work" },
      { label: "Max/Total Assist", value: "max_assist", desc: "Caregiver did >75% of the work" }
    ],
    speech: [
      { label: "Spontaneous", value: "spontaneous", desc: "Said/did it without being asked" },
      { label: "Independent", value: "independent", desc: "Responded correctly to a cue" },
      { label: "Imitated", value: "imitated", desc: "Copied what the caregiver said" },
      { label: "Prompted", value: "prompted", desc: "Needed a hint or partial word" },
      { label: "No Response", value: "refused", desc: "Did not respond" }
    ],
    sped: [
      { label: "Independent", value: "independent", desc: "Completed task alone" },
      { label: "With Guidance", value: "guidance", desc: "Completed with some support" },
      { label: "Emerging", value: "emerging", desc: "Tried but could not complete" },
      { label: "Not Attempted", value: "refused", desc: "Did not attempt" }
    ]
  };
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Fetch Activity Data
  useEffect(() => {
    async function fetchActivity() {
      try {
        const token = await getToken();
        if (!token) return;
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/v1/dashboard/plan`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const foundAct = (data.activities || []).find((a: any) => a.id === activityId);
          setActivity(foundAct);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivity();
  }, [activityId, getToken]);

  // Handle responsive behavior & roles
  useEffect(() => {
    // Avoid synchronous state updates inside effect
    setTimeout(() => {
      if (role === 'child') {
        setViewMode('child');
      } else if (role === 'parent') {
        setViewMode('parent');
      }
    }, 0);

    if (role !== 'child' && role !== 'parent') {
      const handleResize = () => {
        if (window.innerWidth < 768) {
          setViewMode('parent');
        } else {
          setViewMode('split');
        }
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [role]);

  const handleResponse = (resp: string) => {
    setResponseType(resp);
    updateSessionState('logging');
  };

  const submitLog = async () => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('activity_id', activityId);
      formData.append('response', responseType);
      
      const SCORE_MAP: Record<string, number> = {
        'independent': 4,
        'spontaneous': 4,
        'gestural': 3,
        'supervision': 3,
        'imitated': 3,
        'guidance': 3,
        'verbal': 2,
        'min_assist': 2,
        'prompted': 2,
        'physical': 1,
        'mod_assist': 1,
        'max_assist': 1,
        'refused': 0,
        'emerging': 0
      };
      
      formData.append('independence_score', (SCORE_MAP[responseType] ?? 0).toString());
      formData.append('skill_area', activity?.skill_area || 'cognitive');
      
      if (textNote.trim()) {
        formData.append('text_note', textNote.trim());
      }
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/v1/session/log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert("Failed to save session log.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#a1a1aa' }}>
        Loading session...
      </div>
    );
  }
  
  if (!activity) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#f87171' }}>
        <h2>Activity not found!</h2>
        <Link href="/dashboard" className="btn btn-outline" style={{ marginTop: '1rem' }}>Back to Dashboard</Link>
      </div>
    );
  }

  const langCode = (activity?.audio_lang_code || 'en-US').split('-')[0];
  const t = UI_STRINGS[langCode] || UI_STRINGS['en'];

  if (sessionState === 'prep') {

    const handlePlayAudio = () => {
      if (!activity?.steps || activity.steps.length === 0) {
        alert(t.noStepsAlert);
        return;
      }
      
      if (isAudioPlaying) {
        window.speechSynthesis.cancel();
        setIsAudioPlaying(false);
        return;
      }

      window.speechSynthesis.cancel();
      const text = activity.steps.join(". ");
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = activity.audio_lang_code || 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.05; // Slightly higher pitch for a friendlier tone
      
      // Try to select a high-quality voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 && utterance.lang.startsWith('en')) {
        const preferredVoices = ['Samantha', 'Google US English', 'Microsoft Zira', 'Karen', 'Daniel'];
        let selectedVoice = null;
        for (const pref of preferredVoices) {
          selectedVoice = voices.find(v => v.name.includes(pref));
          if (selectedVoice) break;
        }
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female'));
        }
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      
      utterance.onend = () => setIsAudioPlaying(false);
      utterance.onerror = () => setIsAudioPlaying(false);
      
      setIsAudioPlaying(true);
      window.speechSynthesis.speak(utterance);
    };

    const getShortGoal = (goal: string) => {
      if (!goal) return "this skill";
      let short = goal.split(' (')[0].split(',')[0].split('&')[0].trim();
      return short.length > 30 ? short.substring(0, 30) + '...' : short;
    };

    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <SessionHeader />
        <div className="page-wrapper container-sm animate-fade-in" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h1>{activity.title}</h1>
        <p style={{ color: '#a1a1aa', fontSize: '1.25rem', marginBottom: '2rem' }}>
          Goal: {activity.goal}
        </p>
        
        {showVideo && (
          <div className="animate-fade-in" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', backgroundColor: '#000', borderRadius: '0.5rem', marginBottom: '2rem' }}>
            <iframe 
              src={activity.youtube_video_id 
                ? `https://www.youtube.com/embed/${activity.youtube_video_id}?autoplay=1` 
                : `https://www.youtube.com/embed/videoseries?listType=search&list=${encodeURIComponent(activity.goal)}&autoplay=1`
              }
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <button onClick={handlePlayAudio} className="btn" style={{ backgroundColor: isAudioPlaying ? '#ef4444' : '#8b5cf6', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{isAudioPlaying ? '⏸' : '🔊'}</span> {isAudioPlaying ? 'Stop Audio' : t.listen}
          </button>
          
          <button onClick={() => setShowVideo(!showVideo)} className="btn" style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎥</span> {showVideo ? 'Hide Video' : `Watch video on ${getShortGoal(activity.goal)}`}
          </button>
        </div>

        <div className="card" style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>{t.stepsTitle}</h3>
          {activity.steps && activity.steps.length > 0 ? (
            <ol style={{ color: 'var(--foreground)', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
              {activity.steps.map((step: string, i: number) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>{step}</li>
              ))}
            </ol>
          ) : (
            <p style={{ color: '#a1a1aa' }}>{t.noSteps}</p>
          )}
        </div>

        <div className="card" style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>{t.reasoningTitle}</h3>
          <p style={{ color: '#d8b4fe', fontStyle: 'italic', lineHeight: '1.6' }}>
            ✨ {activity.reason}
          </p>
        </div>

                <div style={{ marginBottom: '2rem' }}>
          <button className="btn btn-outline" onClick={() => setShowQR(!showQR)} style={{ width: '100%' }}>
            📱 Connect Child Device
          </button>
          {showQR && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <QRCodeSVG value={`${window.location.origin}/session/${activityId}?role=child`} size={150} />
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>Scan with iPad or tablet</p>
              <button className="btn btn-outline" onClick={() => router.push(`/session/${activityId}?role=parent`)} style={{ marginTop: '1rem' }}>
                Join as Parent on this device
              </button>
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => { window.speechSynthesis.cancel(); updateSessionState('active'); }} style={{ padding: '0.75rem 2rem', fontSize: '1rem', borderRadius: '2rem' }}>
          {t.startBtn}
        </button>
      </div>
    </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)', paddingTop: '64px' }}>
      <SessionHeader>
        {/* Only show toggle on mobile/tablet */}
        <div className="mobile-toggle" style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${viewMode === 'parent' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setViewMode('parent')}
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
          >
            Coaching
          </button>
          <button 
            className={`btn ${viewMode === 'child' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setViewMode('child')}
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
          >
            Child
          </button>
        </div>
      </SessionHeader>

      {/* Split Screen Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Parent Coaching Panel */}
        {(viewMode === 'split' || viewMode === 'parent') && (
          <div style={{ flex: 1, backgroundColor: 'var(--background)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '2rem' }}>
              <span className="badge">Activity</span>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--foreground)' }}>{activity.title}</h2>
              
              <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.05)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                <p style={{ margin: 0, color: 'var(--foreground)', fontSize: '0.875rem' }}>
                  <strong>Goal:</strong> {activity.goal}
                </p>
              </div>

              {sessionState === 'active' ? (
                <div>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#64748b' }}>
                    How did your child respond?
                  </h3>
                  
                  {/* Domain Selector */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {[
                      { id: 'aba', label: 'ABA / Behavior' },
                      { id: 'ot_pt', label: 'OT / PT' },
                      { id: 'speech', label: 'Speech' },
                      { id: 'sped', label: 'Special Ed' }
                    ].map(d => (
                      <button 
                        key={d.id}
                        onClick={() => setDomain(d.id as any)}
                        style={{ 
                          padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '2rem', flexShrink: 0,
                          border: `1px solid ${domain === d.id ? 'var(--primary)' : 'var(--border)'}`,
                          background: domain === d.id ? 'rgba(99,102,241,0.1)' : 'var(--card)',
                          color: domain === d.id ? 'var(--primary)' : 'var(--muted-foreground)',
                          fontWeight: domain === d.id ? 700 : 500, cursor: 'pointer'
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {DOMAIN_PROMPTS[domain].map((prompt) => (
                      <label 
                        key={prompt.value} 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', 
                          border: `1px solid ${selectedResponse === prompt.value ? 'var(--primary)' : 'var(--border)'}`, 
                          borderRadius: '0.5rem', cursor: 'pointer',
                          background: selectedResponse === prompt.value ? 'rgba(99,102,241,0.05)' : 'var(--card)'
                        }}
                      >
                        <input 
                          type="radio" 
                          name="response" 
                          value={prompt.value} 
                          checked={selectedResponse === prompt.value}
                          onChange={() => setSelectedResponse(prompt.value)}
                          style={{ accentColor: 'var(--primary)', width: '1.25rem', height: '1.25rem' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{prompt.label}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>{prompt.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleResponse(selectedResponse)} 
                    disabled={!selectedResponse}
                    style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1rem', opacity: selectedResponse ? 1 : 0.5 }}
                  >
                    Save & Continue
                  </button>
                </div>
              ) : (
                  <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--card-bg)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: 'var(--foreground)' }}>Child Engagement Mode</h4>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button 
                          className={`btn ${engagementMode === 'game' ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => updateEngagementMode('game')}
                        >
                          🎮 Interactive Game
                        </button>
                        <button 
                          className={`btn ${engagementMode === 'music' ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => updateEngagementMode('music')}
                        >
                          🎵 Soothing Music
                        </button>
                      </div>
                    </div>
                  <h3 style={{ color: '#166534' }}>Response Logged!</h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Give your child a high-five and praise them!
                  </p>
                  
                  {/* Text Note */}
                  <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      📝 Add a Text Note (Optional)
                    </label>
                    <textarea 
                      value={textNote}
                      onChange={(e) => setTextNote(e.target.value)}
                      placeholder="Write any additional observations here..."
                      style={{ width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-outline" onClick={() => updateSessionState('active')} disabled={isSubmitting} style={{ flex: 1, padding: '1rem', fontSize: '1.125rem' }}>
                      Back
                    </button>
                    <button className="btn btn-primary" onClick={submitLog} disabled={isSubmitting} style={{ flex: 2, padding: '1rem', fontSize: '1.125rem' }}>
                      {isSubmitting ? 'Saving...' : 'Complete Session'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Struggle Support at bottom */}
            <div style={{ marginTop: 'auto', padding: '1rem 2rem', borderTop: '1px solid var(--border)' }}>
              {showStruggleTips ? (
                <div className="animate-fade-in" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                    <h4 style={{ color: '#334155', margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                      <span style={{ marginRight: '0.5rem' }}>💡</span> Troubleshooting Guide
                    </h4>
                    <button onClick={() => setShowStruggleTips(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.25rem', padding: '0.25rem' }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '1.25rem', border: '1px solid #e2e8f0' }}>📉</div>
                      <div>
                        <strong style={{ display: 'block', color: '#334155', marginBottom: '0.25rem' }}>Reduce the Demand</strong>
                        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Accept a simpler response, like a point or a look, instead of a full word.</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '1.25rem', border: '1px solid #e2e8f0' }}>🎁</div>
                      <div>
                        <strong style={{ display: 'block', color: '#334155', marginBottom: '0.25rem' }}>Increase Motivation</strong>
                        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Bring out their absolute favourite toy or snack right now.</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '1.25rem', border: '1px solid #e2e8f0' }}>⏸️</div>
                      <div>
                        <strong style={{ display: 'block', color: '#334155', marginBottom: '0.25rem' }}>Take a Break</strong>
                        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>It&apos;s always better to end on a positive note and try again later.</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                    <h5 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '1rem' }}>Need personalized guidance?</h5>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {/* Ask a Therapist (Microconsultations) */}
                      <div style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        padding: '1rem', backgroundColor: 'rgba(99, 102, 241, 0.05)', 
                        border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '0.5rem'
                      }}>
                        <div>
                          <strong style={{ display: 'block', color: 'var(--primary)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                            Ask a Therapist
                          </strong>
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Get an immediate solution from a certified professional.</span>
                        </div>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => router.push('/marketplace/ask')}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        >
                          Ask Now
                        </button>
                      </div>

                      {/* Premier Plan Upsell */}
                      <div style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        padding: '1rem', backgroundColor: '#f8fafc', 
                        border: '1px solid #e2e8f0', borderRadius: '0.5rem'
                      }}>
                        <div>
                          <strong style={{ display: 'block', color: '#334155', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                            Upgrade to Premier
                          </strong>
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Get a dedicated coach, customized therapy plans, and unlimited 1-on-1 support.</span>
                        </div>
                        <button className="btn btn-outline" onClick={() => router.push('/pricing')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          View Plans
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  className="btn btn-response-danger" 
                  onClick={() => setShowStruggleTips(true)}
                  style={{ width: '100%', padding: '1rem', fontSize: '1.125rem', fontWeight: 'bold' }}
                >
                  {t.childStruggling}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Child Activity View */}
        {(viewMode === 'split' || viewMode === 'child') && (
          <div style={{ flex: viewMode === 'split' ? 1 : 'none', width: viewMode === 'child' ? '100%' : 'auto', backgroundColor: engagementMode === 'music' && sessionState === 'logging' ? '#0f172a' : '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transition: 'background-color 1s ease' }}>
            
            {sessionState === 'logging' && engagementMode === 'game' && (
              <InteractiveGame emoji={activity.emoji} />
            )}

            {sessionState === 'logging' && engagementMode === 'music' && (
              <div style={{ position: 'absolute', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <audio autoPlay loop src="/soothing-instrumental.mp3" />
                <div style={{ width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', animation: 'pulse 4s infinite alternate' }} />
              </div>
            )}

            {/* Sensory-friendly child interface */}
            <div style={{ textAlign: 'center', zIndex: 10, pointerEvents: 'none', opacity: engagementMode === 'music' && sessionState === 'logging' ? 0 : 1, transition: 'opacity 1s ease' }}>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes float-3d {
                  0% { transform: translateY(0px) rotate(0deg) scale(1); }
                  50% { transform: translateY(-15px) rotate(8deg) scale(1.05); }
                  100% { transform: translateY(0px) rotate(0deg) scale(1); }
                }
                @keyframes pulse-container {
                  0% { box-shadow: 0 10px 30px rgba(244, 63, 94, 0.15), inset 0 -8px 20px rgba(0,0,0,0.05); }
                  50% { box-shadow: 0 15px 50px rgba(244, 63, 94, 0.35), inset 0 -8px 20px rgba(0,0,0,0.05); }
                  100% { box-shadow: 0 10px 30px rgba(244, 63, 94, 0.15), inset 0 -8px 20px rgba(0,0,0,0.05); }
                }
              `}} />
              <div style={{ 
                width: '280px', height: '280px', 
                backgroundColor: '#ffffff', 
                borderRadius: '50%', 
                margin: '0 auto 2rem auto', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                animation: 'pulse-container 4s infinite ease-in-out',
                border: '10px solid #e0f2fe'
              }}>
                <span style={{ 
                  fontSize: '9rem', 
                  animation: 'float-3d 5s infinite ease-in-out',
                  filter: 'drop-shadow(5px 15px 10px rgba(0,0,0,0.25))' 
                }}>
                  {activity.emoji || '✨'}
                </span>
              </div>
              <h2 style={{ color: '#334155', fontSize: '3.5rem', marginBottom: '2rem', fontFamily: 'var(--font-fredoka)', fontWeight: 600, letterSpacing: '1px' }}>{activity.title}</h2>
              
              {sessionState === 'logging' && (
                <div className="animate-fade-in" style={{ color: '#166534', fontSize: '2rem', fontWeight: 'bold' }}>
                  Great job! 🎉
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .mobile-toggle { display: none !important; }
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}} />
    </div>
  );
}
