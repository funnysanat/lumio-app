"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

type GroupSession = {
  id: string;
  therapist_id: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_mins: number;
  mode: string;
  price: number;
  max_participants: number;
  current_participants: number;
  video_room_url: string | null;
};

export default function WorkshopsPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"available" | "enrolled">("available");
  
  const [availableSessions, setAvailableSessions] = useState<GroupSession[]>([]);
  const [enrolledSessions, setEnrolledSessions] = useState<GroupSession[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal state
  const [modalSession, setModalSession] = useState<GroupSession | null>(null);
  const [formData, setFormData] = useState({
    expectation: "",
    child_problem: "",
    expected_resolution: "",
    questions_for_therapist: ""
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      const [availRes, enrolledRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/marketplace/group-sessions`, { headers }),
        fetch(`${API_URL}/api/v1/marketplace/group-sessions/my-enrollments`, { headers })
      ]);
      
      if (availRes.ok) {
        const avail = await availRes.json();
        setAvailableSessions(avail);
      }
      if (enrolledRes.ok) {
        const enrolled = await enrolledRes.json();
        setEnrolledSessions(enrolled);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [getToken, API_URL]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleEnrollClick = (s: GroupSession) => {
    setModalSession(s);
    setFormData({
      expectation: "",
      child_problem: "",
      expected_resolution: "",
      questions_for_therapist: ""
    });
    setError(null);
  };

  const submitEnrollment = async () => {
    if (!user || !modalSession) return;
    setEnrolling(modalSession.id);
    setError(null);
    setSuccess(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/marketplace/group-sessions/${modalSession.id}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          parent_email: user.primaryEmailAddress?.emailAddress || "",
          ...formData
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Enrollment failed.");
      }
      
      const data = await res.json();
      
      if (data.razorpay_order_id) {
        // Mocking Razorpay Payment flow
      }
      
      setSuccess(`Successfully enrolled!`);
      setModalSession(null);
      fetchSessions(); // Refresh lists
      setActiveTab("enrolled"); // Switch to enrolled tab
      
      setTimeout(() => { setSuccess(null); }, 3000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnrolling(null);
    }
  };

  const fmt = (paise: number) => paise > 0 ? `₹${(paise / 100).toLocaleString("en-IN")}` : "Free";

  const renderCard = (s: GroupSession, isEnrolledTab: boolean) => {
    let month = "TBD";
    let dateNum = "??";
    try {
        const d = new Date(s.scheduled_date);
        month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        dateNum = d.getDate().toString();
    } catch(e) {}
    
    const isFull = s.current_participants >= s.max_participants;
    
    const hue = (parseInt(s.id.slice(0,4), 16) || 0) % 360;
    const headerGradient = `linear-gradient(135deg, hsl(${hue}, 70%, 95%), hsl(${(hue + 40) % 360}, 70%, 95%))`;

    return (
      <div key={s.id} style={{ 
        background: "var(--card)", 
        borderRadius: "1rem", 
        overflow: "hidden", 
        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
        border: "1px solid rgba(0,0,0,0.05)",
        display: "flex", 
        flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 20px 40px -10px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 10px 40px -10px rgba(0,0,0,0.08)";
      }}
      >
        <div style={{ 
          height: "120px", 
          background: headerGradient,
          position: "relative",
          padding: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start"
        }}>
          <div style={{ 
            background: "white", 
            borderRadius: "0.75rem", 
            padding: "0.5rem", 
            width: "60px",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#ef4444", textTransform: "uppercase" }}>{month}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--foreground)", lineHeight: 1.1 }}>{dateNum}</div>
          </div>
          
          <div style={{ background: "rgba(255,255,255,0.8)", padding: "0.25rem 0.75rem", borderRadius: "2rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--foreground)", backdropFilter: "blur(4px)" }}>
            {s.duration_mins} min • {s.mode}
          </div>
        </div>

        <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem", fontWeight: 800, lineHeight: 1.3 }}>{s.title}</h3>
          
          <div style={{ color: "var(--primary)", fontWeight: 600, fontSize: "0.9rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🕒</span> {s.scheduled_time}
          </div>

          <p style={{ 
            margin: "0 0 1.5rem 0", 
            fontSize: "0.95rem", 
            color: "var(--muted-foreground)", 
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {s.description || "No description provided."}
          </p>

          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            <Link href={`/marketplace/${s.therapist_id}`} style={{ 
              color: "var(--foreground)", 
              fontSize: "0.85rem", 
              fontWeight: 600, 
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>🧑‍⚕️</div>
              Host Profile
            </Link>
            
            <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", fontWeight: 600 }}>
              {s.max_participants - s.current_participants} spots left
            </div>
          </div>
        </div>

        <div style={{ padding: "1rem 1.5rem", background: "var(--card)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ fontWeight: 800, fontSize: "1.25rem", color: s.price === 0 ? "#22c55e" : "var(--foreground)" }}>
            {fmt(s.price)}
          </div>
          {isEnrolledTab ? (
            <span style={{ 
              padding: "0.5rem 1rem", 
              borderRadius: "2rem", 
              background: "rgba(34,197,94,0.1)", 
              color: "#22c55e", 
              fontWeight: 700,
              fontSize: "0.85rem"
            }}>✓ Registered</span>
          ) : (
            <button 
              onClick={() => handleEnrollClick(s)}
              disabled={isFull}
              style={{ 
                padding: "0.75rem 1.5rem", 
                borderRadius: "0.5rem", 
                background: isFull ? "var(--muted)" : "var(--foreground)", 
                color: isFull ? "var(--muted-foreground)" : "var(--background)", 
                border: "none", 
                cursor: isFull ? "not-allowed" : "pointer", 
                fontWeight: 700,
                transition: "background 0.2s ease"
              }}>
              {isFull ? "Sold Out" : "Get Ticket"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const displaySessions = activeTab === "available" 
    ? availableSessions.filter(s => !enrolledSessions.some(es => es.id === s.id)) // Exclude enrolled
    : enrolledSessions;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", paddingBottom: "4rem", position: "relative" }}>
      <div style={{
        background: "var(--card)",
        borderBottom: "1px solid var(--border)",
        padding: "4rem 2rem",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <Link href="/dashboard" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: "1.5rem" }}>
              <span>←</span> Back to Dashboard
            </Link>
          <h1 style={{ margin: "0 0 1rem", fontWeight: 800, fontSize: "3rem", letterSpacing: "-0.03em", color: "var(--foreground)" }}>
            Workshops & Events
          </h1>
          <p style={{ margin: "0 auto", color: "var(--muted-foreground)", fontSize: "1.1rem", lineHeight: 1.6, maxWidth: "600px" }}>
            Join live, interactive group sessions led by specialized therapists. Discover expert strategies, ask questions, and connect with other caregivers.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--border)" }}>
          <button 
            onClick={() => setActiveTab("available")}
            style={{ 
              background: "none", border: "none", padding: "1rem 2rem", cursor: "pointer",
              fontWeight: 700, fontSize: "1.1rem",
              color: activeTab === "available" ? "var(--primary)" : "var(--muted-foreground)",
              borderBottom: activeTab === "available" ? "3px solid var(--primary)" : "3px solid transparent",
            }}>
            Available Events
          </button>
          <button 
            onClick={() => setActiveTab("enrolled")}
            style={{ 
              background: "none", border: "none", padding: "1rem 2rem", cursor: "pointer",
              fontWeight: 700, fontSize: "1.1rem",
              color: activeTab === "enrolled" ? "var(--primary)" : "var(--muted-foreground)",
              borderBottom: activeTab === "enrolled" ? "3px solid var(--primary)" : "3px solid transparent",
            }}>
            My Events {enrolledSessions.length > 0 && `(${enrolledSessions.length})`}
          </button>
        </div>

        {success && (
          <div style={{ padding: "1rem", background: "rgba(34,197,94,0.1)", color: "#22c55e", borderRadius: "0.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.2rem" }}>🎉</span> {success}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--muted-foreground)" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
            <p>Loading...</p>
          </div>
        ) : displaySessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "6rem 2rem", background: "var(--card)", borderRadius: "1rem", border: "1px dashed var(--border)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{activeTab === "available" ? "🗓️" : "🎫"}</div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>
              {activeTab === "available" ? "No events scheduled right now" : "You haven't enrolled in any events yet"}
            </h3>
            <p style={{ color: "var(--muted-foreground)" }}>
              {activeTab === "available" 
                ? "Check back later or subscribe to notifications." 
                : "Browse available events to find one that suits you."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "2rem" }}>
            {displaySessions.map(s => renderCard(s, activeTab === "enrolled"))}
          </div>
        )}
      </div>

      {/* Enrollment Modal */}
      {modalSession && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, padding: "2rem"
        }}>
          <div style={{
            background: "var(--card)", borderRadius: "1.5rem", width: "100%", maxWidth: "600px",
            maxHeight: "90vh", overflowY: "auto", padding: "2rem", position: "relative",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <button onClick={() => setModalSession(null)} style={{
              position: "absolute", top: "1.5rem", right: "1.5rem",
              background: "var(--muted)", border: "none", width: "32px", height: "32px",
              borderRadius: "50%", cursor: "pointer", fontWeight: "bold"
            }}>✕</button>
            
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>Register for Event</h2>
            <p style={{ color: "var(--primary)", fontWeight: 600, marginBottom: "1.5rem" }}>{modalSession.title}</p>
            
            <div style={{ padding: "1rem", background: "rgba(56,189,248,0.1)", borderRadius: "0.75rem", marginBottom: "2rem", color: "#0369a1", fontSize: "0.9rem" }}>
              Help the therapist prepare by answering a few quick questions (Optional)
            </div>

            {error && (
              <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: "0.5rem", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>What do you expect from this event?</label>
                <textarea 
                  rows={2} 
                  value={formData.expectation} 
                  onChange={e => setFormData({...formData, expectation: e.target.value})}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", outline: "none", resize: "vertical", background: "var(--background)", color: "var(--foreground)" }}
                  placeholder="e.g. Learn new techniques, meet other parents..."
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>What specific problem does your child have?</label>
                <textarea 
                  rows={2} 
                  value={formData.child_problem} 
                  onChange={e => setFormData({...formData, child_problem: e.target.value})}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", outline: "none", resize: "vertical", background: "var(--background)", color: "var(--foreground)" }}
                  placeholder="e.g. Trouble focusing during meals, speech delays..."
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>How can the therapist resolve the issues?</label>
                <textarea 
                  rows={2} 
                  value={formData.expected_resolution} 
                  onChange={e => setFormData({...formData, expected_resolution: e.target.value})}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", outline: "none", resize: "vertical", background: "var(--background)", color: "var(--foreground)" }}
                  placeholder="e.g. Looking for daily actionable exercises"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>Any specific questions for the therapist?</label>
                <textarea 
                  rows={2} 
                  value={formData.questions_for_therapist} 
                  onChange={e => setFormData({...formData, questions_for_therapist: e.target.value})}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", outline: "none", resize: "vertical", background: "var(--background)", color: "var(--foreground)" }}
                  placeholder="Ask anything..."
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button onClick={() => setModalSession(null)} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem", background: "transparent", color: "var(--muted-foreground)", border: "none", cursor: "pointer", fontWeight: 600 }}>
                Cancel
              </button>
              <button 
                onClick={submitEnrollment}
                disabled={!!enrolling}
                style={{ padding: "0.75rem 2rem", borderRadius: "0.5rem", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>
                {enrolling ? "Processing..." : `Complete Registration (${fmt(modalSession.price)})`}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
