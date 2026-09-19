"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

type Booking = {
  id: string;
  therapist_id: string;
  therapist_name: string; // We'd ideally join this in the backend, but we'll mock it for the UI if missing
  scheduled_date: string;
  scheduled_time: string;
  duration_mins: number;
  mode: string;
  session_price: number | null;
  status: string;
  video_room_url: string | null;
};

export default function ParentBookingsPage() {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/v1/marketplace/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setBookings(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const fmt = (paise: number | null) => paise ? `₹${(paise / 100).toLocaleString("en-IN")}` : "—";

  if (loading) return <div style={{ padding: "3rem", textAlign: "center" }}>Loading your sessions...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "2rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <Link href="/marketplace" style={{ color: "var(--muted-foreground)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, display: "inline-block", marginBottom: "0.5rem" }}>
              ← Back to Marketplace
            </Link>
            <h1 style={{ margin: 0 }}>My Sessions</h1>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
            <h3>No sessions booked yet</h3>
            <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>Find a specialist and book your first session.</p>
            <Link href="/marketplace" style={{ padding: "0.75rem 1.5rem", borderRadius: "2rem", background: "var(--primary)", color: "white", textDecoration: "none", fontWeight: 700 }}>
              Find a Therapist
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {bookings.map(b => (
              <div key={b.id} className="card" style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 style={{ margin: "0 0 0.5rem" }}>Session on {b.scheduled_date}</h3>
                    <div style={{ display: "flex", gap: "1rem", color: "var(--muted-foreground)", fontSize: "0.9rem", flexWrap: "wrap" }}>
                      <span>🕒 {b.scheduled_time} ({b.duration_mins} min)</span>
                      <span style={{ textTransform: "capitalize" }}>📍 {b.mode}</span>
                      <span>💰 {fmt(b.session_price)}</span>
                    </div>
                  </div>
                  <span style={{
                    padding: "0.25rem 0.75rem", borderRadius: "2rem", fontSize: "0.8rem", fontWeight: 700, textTransform: "capitalize",
                    background: b.status === "confirmed" ? "rgba(34,197,94,0.1)" : b.status === "pending" ? "rgba(245,158,11,0.1)" : "rgba(107,114,128,0.1)",
                    color: b.status === "confirmed" ? "#22c55e" : b.status === "pending" ? "#f59e0b" : "#6b7280"
                  }}>
                    {b.status}
                  </span>
                </div>

                {b.status === "confirmed" && b.mode === "online" && (
                  <div style={{ background: "rgba(99,102,241,0.08)", padding: "1rem", borderRadius: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <span style={{ fontSize: "0.9rem", color: "var(--muted-foreground)" }}>Join the video call at the scheduled time.</span>
                    <Link href={`/session/live/${b.id}`} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.75rem", background: "var(--primary)", color: "white", textDecoration: "none", fontWeight: 700 }}>
                      📹 Join Video Session
                    </Link>
                  </div>
                )}
                
                {b.status === "completed" && (
                  <div style={{ background: "rgba(34,197,94,0.08)", padding: "1rem", borderRadius: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <span style={{ fontSize: "0.9rem", color: "var(--muted-foreground)" }}>Session completed. Check your email for the AI summary!</span>
                    {/* In a real app we'd add a "Write Review" button here */}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
