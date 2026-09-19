"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import SessionSummaryModal from "./SessionSummaryModal";

type Booking = {
  id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string | null;
  child_name: string | null;
  child_age_months: number | null;
  child_condition: string | null;
  parent_notes: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_mins: number;
  mode: string;
  session_type: string;
  session_price: number | null;
  status: string;
  therapist_notes: string | null;
  created_at: string;
};

type TherapistProfile = {
  id: string;
  full_name: string;
  is_listing_active: boolean;
  is_verified: boolean;
  listing_tier: string;
  avg_rating: number;
  total_sessions: number;
  total_reviews: number;
  specialisations: string[];
  mode: string;
  city: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  confirmed: { label: "Confirmed", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  completed: { label: "Completed", color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  no_show:   { label: "No Show",   color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

const TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  child_therapy: { label: "Child Therapy", icon: "👶" },
  caregiver_1on1: { label: "Caregiver Training", icon: "🧑‍🏫" },
  caregiver_group: { label: "Group Workshop", icon: "👥" },
};

export default function TherapistDashboardPage() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed">("pending");
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [summaryBookingId, setSummaryBookingId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [profRes, bookRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/therapist/me`, { headers }),
        fetch(`${API_URL}/api/v1/therapist/bookings`, { headers }),
      ]);
      if (profRes.status === 404) {
        window.location.href = "/therapist/onboarding";
        return;
      }
      setProfile(await profRes.json());
      setBookings(await bookRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateBooking = async (bookingId: string, status: string) => {
    const token = await getToken();
    await fetch(`${API_URL}/api/v1/therapist/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status, therapist_notes: notes || null }),
    });
    setActionId(null);
    setNotes("");
    fetchData();
  };

  const filteredBookings = bookings.filter(b => filter === "all" || b.status === filter);
  const pendingCount = bookings.filter(b => b.status === "pending").length;

  const fmt = (paise: number | null) => paise ? `₹${(paise / 100).toLocaleString("en-IN")}` : "—";
  const ageStr = (months: number | null) => {
    if (!months) return null;
    const y = Math.floor(months / 12), m = months % 12;
    return y > 0 ? `${y}y ${m}m` : `${m}m`;
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
        <p style={{ color: "var(--muted-foreground)" }}>Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "4rem" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--card)", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="14" width="8" height="8" rx="2.5" fill="#38bdf8" />
            <rect x="13" y="14" width="8" height="8" rx="2.5" fill="#a78bfa" />
            <rect x="8" y="5" width="8" height="8" rx="2.5" fill="#f472b6" />
          </svg>
          <span style={{ fontWeight: 700, color: "var(--foreground)" }}>Lumio AI</span>
          <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>/ Therapist Dashboard</span>
        </Link>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {profile && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {profile.is_verified && (
                <span style={{ background: "rgba(56,189,248,0.12)", color: "#38bdf8", fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "2rem", border: "1px solid rgba(56,189,248,0.3)" }}>
                  ✓ Verified
                </span>
              )}
              <span style={{ background: "rgba(99,102,241,0.1)", color: "var(--primary)", fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "2rem", border: "1px solid rgba(99,102,241,0.2)", textTransform: "capitalize" }}>
                {profile.listing_tier}
              </span>
            </div>
          )}
          <Link href="/therapist/content" style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
            Content Hub
          </Link>
          <Link href="/therapist/group-sessions" style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
            Group Sessions
          </Link>
          <Link href="/therapist/payments" style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
            Payments
          </Link>
          <Link href="/therapist/settings" style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
            Edit Profile
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
        {/* Welcome + stats */}
        {profile && (
          <>
            <div style={{ marginBottom: "1.5rem" }}>
              <h1 style={{ margin: 0, fontWeight: 800, fontSize: "1.75rem" }}>Welcome back, {profile.full_name.split(" ")[0]} 👋</h1>
              <p style={{ margin: "0.25rem 0 0", color: "var(--muted-foreground)" }}>Here&apos;s what&apos;s happening with your practice on Lumio</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { label: "Pending Requests", value: pendingCount, color: "#f59e0b", icon: "🕐" },
                { label: "Total Sessions", value: profile.total_sessions, color: "#38bdf8", icon: "📅" },
                { label: "Avg Rating", value: profile.avg_rating > 0 ? `${profile.avg_rating.toFixed(1)} ★` : "—", color: "#f472b6", icon: "⭐" },
                { label: "Reviews", value: profile.total_reviews, color: "#a78bfa", icon: "💬" },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>{s.icon}</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {!profile.is_listing_active && (
              <div style={{ marginBottom: "1.5rem", padding: "1rem 1.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.75rem", color: "#f87171" }}>
                ⚠️ Your listing is currently inactive. Contact support to activate it.
              </div>
            )}
          </>
        )}

        {/* Bookings */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <h2 style={{ margin: 0, fontWeight: 700 }}>Booking Requests</h2>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {(["pending", "confirmed", "completed", "all"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{
                    padding: "0.4rem 1rem", borderRadius: "2rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, textTransform: "capitalize",
                    background: filter === f ? "var(--primary)" : "var(--card)",
                    color: filter === f ? "white" : "var(--muted-foreground)",
                    border: `1px solid ${filter === f ? "var(--primary)" : "var(--border)"}`,
                  }}>
                  {f}{f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
                </button>
              ))}
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>
              {filter === "pending" ? "No pending requests — you're all caught up! 🎉" : `No ${filter} bookings.`}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredBookings.map(b => {
                const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                const tc = TYPE_CONFIG[b.session_type] || TYPE_CONFIG.child_therapy;
                const isExpanded = actionId === b.id;
                return (
                  <div key={b.id} style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", overflow: "hidden" }}>
                    <div style={{ padding: "1.25rem", display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: "1rem" }}>{b.parent_name}</span>
                          <span style={{ background: sc.bg, color: sc.color, fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "2rem" }}>
                            {sc.label}
                          </span>
                          <span style={{ background: "rgba(56,189,248,0.08)", color: "#38bdf8", fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "2rem", textTransform: "capitalize" }}>
                            {b.mode}
                          </span>
                          <span style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "2rem" }}>
                            {tc.icon} {tc.label}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", color: "var(--muted-foreground)", flexWrap: "wrap" }}>
                          <span>📅 {b.scheduled_date} at {b.scheduled_time}</span>
                          <span>⏱ {b.duration_mins} min</span>
                          <span>💰 {fmt(b.session_price)}</span>
                        </div>
                        {b.child_name && (
                          <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
                            👧 {b.child_name}{b.child_age_months ? `, ${ageStr(b.child_age_months)}` : ""}{b.child_condition ? ` · ${b.child_condition.replace("_", " ")}` : ""}
                          </div>
                        )}
                        {b.parent_notes && (
                          <div style={{ fontSize: "0.85rem", fontStyle: "italic", color: "var(--muted-foreground)", background: "var(--muted)", padding: "0.5rem 0.75rem", borderRadius: "0.5rem" }}>
                            &quot;{b.parent_notes}&quot;
                          </div>
                        )}
                        <div style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>
                          {b.parent_email}{b.parent_phone ? ` · ${b.parent_phone}` : ""}
                        </div>
                      </div>
                      {b.status === "pending" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                          <button onClick={() => setActionId(isExpanded ? null : b.id)}
                            style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap" }}>
                            {isExpanded ? "Close" : "Respond"}
                          </button>
                        </div>
                      )}
                    </div>
                    {isExpanded && b.status === "pending" && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "1.25rem", background: "var(--muted)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                          <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: "0.4rem" }}>Add a note to the parent (optional)</label>
                          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. Please bring any previous assessment reports to the session."
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                          <button onClick={() => updateBooking(b.id, "confirmed")}
                            style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", background: "#22c55e", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>
                            ✓ Confirm Booking
                          </button>
                          <button onClick={() => updateBooking(b.id, "cancelled")}
                            style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontWeight: 700 }}>
                            ✕ Decline
                          </button>
                        </div>
                      </div>
                    )}
                    {b.status === "confirmed" && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "1.25rem", background: "rgba(56,189,248,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <span style={{ fontSize: "0.9rem", color: "var(--foreground)", fontWeight: 600 }}>Ready for session?</span>
                          <span style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>{b.mode === "online" ? "Join the video call at the scheduled time." : "Meet in person at the scheduled time."}</span>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                          {b.mode === "online" && (
                            <Link href={`/session/live/${b.id}`} style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", background: "var(--primary)", color: "white", textDecoration: "none", fontWeight: 700, display: "inline-block" }}>
                              📹 Join Video
                            </Link>
                          )}
                          <button onClick={() => setSummaryBookingId(b.id)} style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 700 }}>
                            Add Post-Session Summary
                          </button>
                        </div>
                      </div>
                    )}
                    {b.status === "completed" && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "1.25rem", background: "var(--muted)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                        <span style={{ fontSize: "0.9rem", color: "var(--muted-foreground)" }}>Session completed. Summary provided.</span>
                        <button onClick={() => setSummaryBookingId(b.id)} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                          Edit Summary
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {summaryBookingId && (
        <SessionSummaryModal 
          bookingId={summaryBookingId} 
          onClose={() => setSummaryBookingId(null)} 
          onSuccess={() => {
            setSummaryBookingId(null);
            fetchData();
          }} 
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
