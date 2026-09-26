"use client";

import { useEffect, useState } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

type GroupSessionEnrollment = {
  id: string;
  parent_name: string;
  parent_email: string;
  status: string;
  expectation: string | null;
  child_problem: string | null;
  expected_resolution: string | null;
  questions_for_therapist: string | null;
  created_at: string;
};

type GroupSession = {
  id: string;
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
  enrollments?: GroupSessionEnrollment[];
};

export default function TherapistGroupSessionsPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    scheduled_date: "",
    scheduled_time: "",
    duration_mins: 60,
    mode: "online",
    price: "",
    max_participants: 10
  });

  const [viewingParticipants, setViewingParticipants] = useState<GroupSession | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/therapist/group-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/therapist/group-sessions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          scheduled_date: form.scheduled_date,
          scheduled_time: form.scheduled_time,
          duration_mins: Number(form.duration_mins),
          mode: form.mode,
          price: Math.round(Number(form.price) * 100),
          max_participants: Number(form.max_participants)
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ title: "", description: "", scheduled_date: "", scheduled_time: "", duration_mins: 60, mode: "online", price: "", max_participants: 10 });
        fetchSessions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fmt = (paise: number) => paise > 0 ? `₹${(paise / 100).toLocaleString("en-IN")}` : "Free";

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "4rem" }}>
      {/* Top bar Header */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--card)", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="14" width="8" height="8" rx="2.5" fill="#38bdf8" />
            <rect x="13" y="14" width="8" height="8" rx="2.5" fill="#a78bfa" />
            <rect x="8" y="5" width="8" height="8" rx="2.5" fill="#f472b6" />
          </svg>
          <span style={{ fontWeight: 700, color: "var(--foreground)" }}>Lumio AI</span>
          <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>/ Workshops</span>
        </Link>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/therapist/dashboard" style={{ padding: "0.5rem 1rem", borderRadius: "2rem", border: "1px solid var(--border)", background: "white", color: "var(--foreground)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
            ← Back to Dashboard
          </Link>
          <UserButton />
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.8rem" }}>Group Sessions & Workshops</h1>
            <p style={{ color: "var(--muted-foreground)", margin: "0.5rem 0 0 0" }}>Manage your upcoming group training events and caregiver workshops.</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>
            + Schedule Workshop
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--muted-foreground)" }}>Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="card" style={{ padding: "4rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <div style={{ fontSize: "3rem" }}>👥</div>
            <h3 style={{ margin: 0 }}>No group sessions scheduled</h3>
            <p style={{ color: "var(--muted-foreground)", margin: 0 }}>Schedule your first workshop to train multiple caregivers at once.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {sessions.map(s => (
              <div key={s.id} className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.2rem" }}>{s.title}</h3>
                    <div style={{ display: "flex", gap: "1rem", color: "var(--muted-foreground)", fontSize: "0.85rem", fontWeight: 500 }}>
                      <span>📅 {s.scheduled_date} at {s.scheduled_time}</span>
                      <span>⏱ {s.duration_mins} min</span>
                      <span style={{ textTransform: "capitalize" }}>📍 {s.mode}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{s.current_participants} / {s.max_participants}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase" }}>Enrolled</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#22c55e" }}>{fmt(s.price)}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase" }}>Ticket Price</div>
                    </div>
                  </div>
                </div>
                {s.description && (
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted-foreground)", background: "var(--muted)", padding: "1rem", borderRadius: "0.5rem" }}>
                    {s.description}
                  </p>
                )}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button 
                    onClick={() => setViewingParticipants(viewingParticipants?.id === s.id ? null : s)}
                    style={{ background: "transparent", color: "var(--foreground)", border: "1px solid var(--border)", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}>
                    {viewingParticipants?.id === s.id ? "Hide Participants" : `View Participants (${s.enrollments?.length || 0})`}
                  </button>
                  {s.mode === "online" && (
                    <Link href={`/session/live/${s.id}`} style={{ padding: "0.6rem 1.25rem", borderRadius: "0.5rem", background: "rgba(99,102,241,0.1)", color: "var(--primary)", textDecoration: "none", fontWeight: 700 }}>
                      📹 Join Video Room
                    </Link>
                  )}
                </div>

                {/* Participants Accordion View */}
                {viewingParticipants?.id === s.id && (
                  <div style={{ marginTop: "1rem", padding: "1.5rem", background: "#f9fafb", borderRadius: "0.75rem", border: "1px solid var(--border)" }}>
                    <h4 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700 }}>Registered Participants</h4>
                    
                    {!s.enrollments || s.enrollments.length === 0 ? (
                      <div style={{ color: "var(--muted-foreground)", fontSize: "0.9rem", fontStyle: "italic" }}>
                        No one has registered for this workshop yet.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {s.enrollments.map((en, idx) => (
                          <div key={idx} style={{ padding: "1rem", background: "white", borderRadius: "0.5rem", border: "1px solid var(--border)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                              <div>
                                <div style={{ fontWeight: 700, color: "var(--foreground)" }}>{en.parent_name}</div>
                                <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>{en.parent_email}</div>
                              </div>
                              <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", background: en.status === "confirmed" ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)", color: en.status === "confirmed" ? "#16a34a" : "#ca8a04", borderRadius: "1rem", fontWeight: 700, textTransform: "capitalize" }}>
                                {en.status.replace("_", " ")}
                              </span>
                            </div>
                            
                            {(en.expectation || en.child_problem || en.expected_resolution || en.questions_for_therapist) && (
                              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed var(--border)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {en.expectation && (
                                  <div>
                                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Expectations</div>
                                    <div style={{ fontSize: "0.9rem", color: "var(--foreground)" }}>{en.expectation}</div>
                                  </div>
                                )}
                                {en.child_problem && (
                                  <div>
                                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Child&apos;s Challenge</div>
                                    <div style={{ fontSize: "0.9rem", color: "var(--foreground)" }}>{en.child_problem}</div>
                                  </div>
                                )}
                                {en.expected_resolution && (
                                  <div>
                                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Desired Resolution</div>
                                    <div style={{ fontSize: "0.9rem", color: "var(--foreground)" }}>{en.expected_resolution}</div>
                                  </div>
                                )}
                                {en.questions_for_therapist && (
                                  <div>
                                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Questions for You</div>
                                    <div style={{ fontSize: "0.9rem", color: "var(--foreground)", background: "rgba(99,102,241,0.05)", padding: "0.5rem", borderRadius: "0.25rem", borderLeft: "2px solid var(--primary)" }}>{en.questions_for_therapist}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: 0 }}>Schedule Workshop</h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Title</label>
                <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
              </div>
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Date</label>
                  <input type="date" required value={form.scheduled_date} onChange={e => setForm(f => ({...f, scheduled_date: e.target.value}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                </div>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Time</label>
                  <input type="time" required value={form.scheduled_time} onChange={e => setForm(f => ({...f, scheduled_time: e.target.value}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Duration (min)</label>
                  <input type="number" required value={form.duration_mins} onChange={e => setForm(f => ({...f, duration_mins: Number(e.target.value)}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                </div>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Max Participants</label>
                  <input type="number" required value={form.max_participants} onChange={e => setForm(f => ({...f, max_participants: Number(e.target.value)}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Mode</label>
                  <select value={form.mode} onChange={e => setForm(f => ({...f, mode: e.target.value}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}>
                    <option value="online">Online Video</option>
                    <option value="offline">In-Person</option>
                  </select>
                </div>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Ticket Price (₹)</label>
                  <input type="number" required value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem", background: "transparent", color: "var(--foreground)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>
                  Publish Workshop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
