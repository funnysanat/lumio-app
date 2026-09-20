"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { HistoryData } from "@/store/useAppStore";

type DevelopmentalSnapshot = {
  id: string;
  assessment_date: string;
  chronological_age_months: number;
  domain_scores: Record<string, string>;
  next_milestones: Record<string, string[]>;
};

type TherapistBooking = {
  id: string;
  therapist_name: string;
  specialty: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  ai_summary?: string | null;
  therapist_notes?: string | null;
};

export default function ProgressReportPage() {
  const { getToken } = useAuth();
  const [baseline, setBaseline] = useState<DevelopmentalSnapshot | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [therapistSessions, setTherapistSessions] = useState<TherapistBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        
        // Fetch Baseline Snapshot
        const snapRes = await fetch(`${API_URL}/api/v1/onboarding/child/snapshots`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (snapRes.ok) {
          const snaps = await snapRes.json();
          if (snaps && snaps.length > 0) {
            // Get the earliest snapshot for the baseline
            setBaseline(snaps[snaps.length - 1]);
          }
        }

        // Fetch Home Activity History
        const histRes = await fetch(`${API_URL}/api/v1/dashboard/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (histRes.ok) {
          setHistory(await histRes.json());
        }

        // Fetch Therapist Bookings
        const bookRes = await fetch(`${API_URL}/api/v1/marketplace/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (bookRes.ok) {
          const bookings: TherapistBooking[] = await bookRes.json();
          // Filter to only completed sessions with notes or ai_summary
          setTherapistSessions(bookings.filter((b: any) => b.status === "completed" && (b.ai_summary || b.therapist_notes)));
        }
      } catch (err) {
        console.error("Error fetching report data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center" }}>Loading report...</div>;
  }

  // Combine and sort events
  const allEvents: any[] = [];

  // Add home activity sessions
  history.forEach(day => {
    day.sessions.forEach(s => {
      allEvents.push({
        type: "home_activity",
        date: new Date(day.date),
        title: s.activity_name,
        details: s.response,
        summary: s.ai_summary || s.text_note,
        timestamp: new Date(`${day.date}T${s.time}`).getTime()
      });
    });
  });

  // Add therapist sessions
  therapistSessions.forEach(ts => {
    allEvents.push({
      type: "therapist_session",
      date: new Date(ts.scheduled_date),
      title: `Therapy Session with ${ts.therapist_name}`,
      details: ts.specialty,
      summary: ts.ai_summary || ts.therapist_notes,
      timestamp: new Date(`${ts.scheduled_date}T${ts.scheduled_time}`).getTime()
    });
  });

  // Sort chronological (oldest first)
  allEvents.sort((a, b) => a.timestamp - b.timestamp);

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="print-container" style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", color: "#111", background: "white", minHeight: "100vh" }}>
      
      {/* Header & Controls */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <Link href="/dashboard/progress" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
          ← Back to Tracker
        </Link>
        <button onClick={handlePrint} style={{ padding: "0.5rem 1rem", background: "var(--primary)", color: "white", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: 600 }}>
          🖨️ Print / Download PDF
        </button>
      </div>

      <div style={{ borderBottom: "2px solid #eee", paddingBottom: "1.5rem", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "#111" }}>Comprehensive Progress Report</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Section 1: Baseline */}
      {baseline && (
        <section className="break-inside-avoid" style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, borderBottom: "1px solid #ddd", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
            1. Baseline Assessment
          </h2>
          <p style={{ color: "#555", marginBottom: "1rem" }}>
            Recorded on {new Date(baseline.assessment_date).toLocaleDateString()} | Age: {baseline.chronological_age_months} months
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {Object.entries(baseline.domain_scores || {}).map(([domain, score]) => (
              <div key={domain} style={{ background: "#f9fafb", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>{domain.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111", marginTop: "0.25rem" }}>{score as string}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Timeline */}
      <section>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, borderBottom: "1px solid #ddd", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
          2. Therapy & Activity Log
        </h2>
        
        {allEvents.length === 0 ? (
          <p style={{ color: "#666" }}>No activities or sessions recorded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {allEvents.map((ev, i) => (
              <div key={i} className="break-inside-avoid" style={{ borderLeft: `4px solid ${ev.type === 'home_activity' ? '#3b82f6' : '#10b981'}`, paddingLeft: "1rem" }}>
                <div style={{ fontSize: "0.85rem", color: "#666", fontWeight: 600 }}>{ev.date.toLocaleDateString()}</div>
                <h3 style={{ margin: "0.25rem 0", fontSize: "1.1rem", color: "#111" }}>{ev.title}</h3>
                {ev.details && <div style={{ fontSize: "0.9rem", color: "#555", fontStyle: "italic", marginBottom: "0.5rem" }}>{ev.details}</div>}
                
                {ev.summary && (
                  <div style={{ background: "#f3f4f6", padding: "1rem", borderRadius: "0.5rem", fontSize: "0.95rem", color: "#333", whiteSpace: "pre-wrap" }}>
                    {ev.summary}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={{ marginTop: "4rem", textAlign: "center", color: "#9ca3af", fontSize: "0.85rem" }}>
        Report generated by Lumio Special Education Platform
      </div>
    </main>
  );
}
