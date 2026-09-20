"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

type Booking = {
  id: string;
  parent_name: string;
  child_name: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_mins: number;
  mode: string;
  session_price: number | null;
  status: string;
  created_at: string;
};

export default function TherapistPaymentsPage() {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/v1/therapist/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        }
      } catch (e) {
        console.error("Failed to fetch payments", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getToken, API_URL]);

  const completedSessions = bookings.filter(b => b.status === "completed" || b.status === "confirmed");
  
  // Calculate net earnings from completed sessions (Therapist gets 88% of base price)
  const totalNetEarningsPaise = completedSessions.reduce((acc, b) => acc + (b.session_price ? b.session_price * 0.88 : 0), 0);
  const totalNetEarnings = totalNetEarningsPaise / 100;

  const fmt = (paise: number | null) => paise ? `₹${(paise / 100).toLocaleString("en-IN")}` : "—";
  const fmtNet = (paise: number | null) => paise ? `₹${((paise * 0.88) / 100).toLocaleString("en-IN")}` : "—";

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
        <p style={{ color: "var(--muted-foreground)" }}>Loading payment history...</p>
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
          <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>/ Payment History</span>
        </Link>
        <Link href="/therapist/dashboard" style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
          Back to Dashboard
        </Link>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
        <h1 style={{ margin: "0 0 1.5rem 0", fontWeight: 800, fontSize: "1.75rem" }}>Earnings & Payments</h1>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div className="card" style={{ padding: "1.5rem", textAlign: "center", background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(56,189,248,0.1))" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💸</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)" }}>₹{totalNetEarnings.toLocaleString("en-IN", {maximumFractionDigits:0})}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", fontWeight: 600, marginTop: "0.25rem" }}>Total Net Earnings (After Platform Fee)</div>
          </div>
          <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📈</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)" }}>{completedSessions.length}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", fontWeight: 600, marginTop: "0.25rem" }}>Billable Sessions</div>
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1.25rem" }}>Session History</h2>
          </div>
          {completedSessions.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>
              No completed sessions yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", textAlign: "left" }}>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Date & Time</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Patient</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Type</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: 600, color: "var(--muted-foreground)", textAlign: "right" }}>Gross Price</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: 600, color: "var(--muted-foreground)", textAlign: "right" }}>Net Earnings</th>
                    <th style={{ padding: "1rem 1.5rem", fontWeight: 600, color: "var(--muted-foreground)", textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSessions.map(b => (
                    <tr key={b.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem 1.5rem", color: "var(--foreground)" }}>
                        <div style={{ fontWeight: 500 }}>{b.scheduled_date}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>{b.scheduled_time} ({b.duration_mins}m)</div>
                      </td>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <div style={{ fontWeight: 500 }}>{b.parent_name}</div>
                        {b.child_name && <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>for {b.child_name}</div>}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", textTransform: "capitalize", color: "var(--muted-foreground)" }}>
                        {b.mode}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", color: "var(--muted-foreground)", textAlign: "right" }}>
                        {fmt(b.session_price)}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "#22c55e", textAlign: "right" }}>
                        {fmtNet(b.session_price)}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                        {b.status === "completed" ? (
                          <span style={{ background: "rgba(56,189,248,0.1)", color: "#38bdf8", padding: "0.2rem 0.6rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 700 }}>
                            Completed
                          </span>
                        ) : (
                          <span style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "0.2rem 0.6rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 700 }}>
                            Confirmed (Pending)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
