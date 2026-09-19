"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";

type Therapist = {
  id: string;
  full_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  specialisations: string[];
  qualifications: { degree: string; institution: string; year?: number }[];
  experience_years: number;
  languages: string[];
  min_age_months: number | null;
  max_age_months: number | null;
  mode: string;
  session_duration_mins: number;
  session_price_online: number | null;
  session_price_offline: number | null;
  offers_child_therapy: boolean;
  offers_caregiver_training: boolean;
  offers_group_training: boolean;
  caregiver_price_online: number | null;
  caregiver_price_offline: number | null;
  group_price_online: number | null;
  group_price_offline: number | null;
  city: string | null;
  state: string | null;
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  total_sessions: number;
  match_score: number | null;
  availability: { day_of_week: number; start_time: string; end_time: string; session_type: string }[];
};

const SPEC_LABELS: Record<string, string> = {
  autism: "Autism", speech_delay: "Speech Delay", adhd: "ADHD",
  cerebral_palsy: "Cerebral Palsy", down_syndrome: "Down Syndrome",
  learning_disability: "Learning Disability", intellectual_disability: "Intellectual Disability",
  sensory_processing: "Sensory Processing", behavioural: "Behavioural", motor_delay: "Motor Delay",
};
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const fmt = (paise: number | null) => paise ? `₹${(paise / 100).toLocaleString("en-IN")}` : null;
const ageRange = (min: number | null, max: number | null) => {
  if (!min && !max) return null;
  const toStr = (m: number) => m < 12 ? `${m}m` : `${Math.floor(m / 12)}y${m % 12 ? ` ${m % 12}m` : ""}`;
  if (min && max) return `${toStr(min)} – ${toStr(max)}`;
  if (min) return `${toStr(min)}+`;
  return `Up to ${toStr(max!)}`;
};

export default function TherapistProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingMode, setBookingMode] = useState("online");
  const [sessionType, setSessionType] = useState("child_therapy");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    parent_name: "",
    parent_email: "",
    parent_phone: "",
    child_name: "",
    child_condition: "",
    parent_notes: "",
    scheduled_date: "",
    scheduled_time: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const load = async () => {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/marketplace/therapist/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTherapist(data);
        if (!data.offers_child_therapy && data.offers_caregiver_training) {
          setSessionType("caregiver_1on1");
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        parent_name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        parent_email: user.primaryEmailAddress?.emailAddress || "",
      }));
    }
  }, [user]);

  const handleBook = async () => {
    if (!therapist) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/marketplace/book`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          therapist_id: therapist.id,
          parent_name: form.parent_name,
          parent_email: form.parent_email,
          parent_phone: form.parent_phone || null,
          child_name: form.child_name || null,
          child_condition: form.child_condition || null,
          parent_notes: form.parent_notes || null,
          scheduled_date: form.scheduled_date,
          scheduled_time: form.scheduled_time,
          mode: bookingMode,
          session_type: sessionType,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Booking failed.");
      }
      
      const booking = await res.json();
      
      if (booking.razorpay_order_id) {
        // Mocking the Razorpay UI since we don't have test keys.
        // We will immediately verify the payment as successful.
        const verifyRes = await fetch(`${API_URL}/api/v1/marketplace/book/${booking.id}/verify`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: "pay_mock_" + Math.random().toString(36).substring(7),
            razorpay_order_id: booking.razorpay_order_id,
            razorpay_signature: "mock_sig_valid"
          }),
        });
        
        if (!verifyRes.ok) {
          throw new Error("Payment verification failed.");
        }
      }
      
      setBooked(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
      <div style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!therapist) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--background)", gap: "1rem" }}>
      <div style={{ fontSize: "3rem" }}>😕</div>
      <h2>Therapist not found</h2>
      <Link href="/marketplace" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>← Back to Marketplace</Link>
    </div>
  );

  let price = null;
  if (sessionType === "child_therapy") {
    price = bookingMode === "online" ? therapist.session_price_online : therapist.session_price_offline;
  } else if (sessionType === "caregiver_1on1") {
    price = bookingMode === "online" ? therapist.caregiver_price_online : therapist.caregiver_price_offline;
  }
  
  const scorePercent = therapist.match_score !== null ? Math.round(therapist.match_score * 100) : null;

  // Calculate available slots based on selected date
  let selectedDayOfWeek = -1;
  let availableSlotsForDate: typeof therapist.availability = [];
  
  if (form.scheduled_date) {
    selectedDayOfWeek = new Date(form.scheduled_date + "T00:00:00Z").getUTCDay();
    availableSlotsForDate = therapist.availability
      .filter(a => a.day_of_week === selectedDayOfWeek && a.session_type === sessionType)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "6rem" }}>
      {/* Nav */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--card)", padding: "1rem 2rem" }}>
        <Link href="/marketplace" style={{ color: "var(--muted-foreground)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
          ← Back to Marketplace
        </Link>
      </div>

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "2rem" }}>
        {/* Profile header */}
        <div className="card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{
              width: "88px", height: "88px", borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #6366f1, #38bdf8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem", fontWeight: 800, color: "white", overflow: "hidden",
            }}>
              {therapist.profile_photo_url
                ? <img src={therapist.profile_photo_url} alt={therapist.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : therapist.full_name.charAt(0)
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                <h1 style={{ margin: 0, fontWeight: 800, fontSize: "1.6rem" }}>{therapist.full_name}</h1>
                {therapist.is_verified && (
                  <span style={{ background: "rgba(56,189,248,0.12)", color: "#38bdf8", fontSize: "0.78rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "2rem", border: "1px solid rgba(56,189,248,0.3)" }}>
                    ✓ Lumio Verified
                  </span>
                )}
                {scorePercent !== null && (
                  <span style={{
                    background: scorePercent >= 70 ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                    color: scorePercent >= 70 ? "#22c55e" : "#f59e0b",
                    fontSize: "0.78rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "2rem",
                    border: `1px solid ${scorePercent >= 70 ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
                  }}>
                    {scorePercent}% match for your child
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.85rem", color: "var(--muted-foreground)", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                <span>🎓 {therapist.experience_years} years experience</span>
                {therapist.city && <span>📍 {therapist.city}{therapist.state ? `, ${therapist.state}` : ""}</span>}
                {therapist.avg_rating > 0 && <span>⭐ {therapist.avg_rating.toFixed(1)} ({therapist.total_reviews} reviews)</span>}
                <span>📅 {therapist.total_sessions} sessions completed</span>
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {therapist.specialisations.map(s => (
                  <span key={s} style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontSize: "0.78rem", fontWeight: 600, padding: "0.25rem 0.6rem", borderRadius: "2rem" }}>
                    {SPEC_LABELS[s] || s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {therapist.bio && (
            <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "var(--muted)", borderRadius: "0.75rem", lineHeight: 1.7, color: "var(--foreground)", fontSize: "0.95rem" }}>
              {therapist.bio}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          {/* Details */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontWeight: 700 }}>Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted-foreground)" }}>Mode</span>
                <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{therapist.mode === "both" ? "Online & In-person" : therapist.mode}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted-foreground)" }}>Session</span>
                <span style={{ fontWeight: 600 }}>{therapist.session_duration_mins} min</span>
              </div>
              {fmt(therapist.session_price_online) && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted-foreground)" }}>Online</span>
                  <span style={{ fontWeight: 700, color: "var(--primary)" }}>{fmt(therapist.session_price_online)}</span>
                </div>
              )}
              {fmt(therapist.session_price_offline) && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted-foreground)" }}>In-person</span>
                  <span style={{ fontWeight: 700, color: "var(--primary)" }}>{fmt(therapist.session_price_offline)}</span>
                </div>
              )}
              {ageRange(therapist.min_age_months, therapist.max_age_months) && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted-foreground)" }}>Age range</span>
                  <span style={{ fontWeight: 600 }}>{ageRange(therapist.min_age_months, therapist.max_age_months)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted-foreground)" }}>Languages</span>
                <span style={{ fontWeight: 600 }}>{therapist.languages.join(", ")}</span>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontWeight: 700 }}>Weekly Availability</h3>
            {therapist.availability.length === 0 ? (
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>Not set yet — contact therapist to check availability.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {therapist.availability
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map(a => (
                    <div key={a.day_of_week} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.87rem" }}>
                      <span style={{ fontWeight: 600 }}>{DAYS[a.day_of_week]}</span>
                      <span style={{ color: "var(--muted-foreground)" }}>{a.start_time} – {a.end_time}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Qualifications */}
        {therapist.qualifications.length > 0 && (
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontWeight: 700 }}>Qualifications</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {therapist.qualifications.map((q, i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", fontSize: "0.9rem" }}>
                  <span style={{ fontWeight: 700 }}>{q.degree}</span>
                  <span style={{ color: "var(--muted-foreground)" }}>{q.institution}{q.year ? `, ${q.year}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book button — sticky or inline */}
        {!showBooking && !booked && (
          <button onClick={() => setShowBooking(true)}
            style={{ width: "100%", padding: "1rem", borderRadius: "1rem", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 800, fontSize: "1.05rem", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
            Request a Session
          </button>
        )}

        {/* Booking confirmed */}
        {booked && (
          <div style={{ padding: "2rem", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
            <h3 style={{ margin: "0 0 0.5rem", color: "#22c55e" }}>Booking Request Sent!</h3>
            <p style={{ color: "var(--muted-foreground)", margin: "0 0 1.25rem" }}>
              {therapist.full_name} will confirm your request within 24 hours. You'll receive an email confirmation.
            </p>
            <Link href="/dashboard" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>← Back to Dashboard</Link>
          </div>
        )}

        {/* Booking form */}
        {showBooking && !booked && (
          <div className="card" style={{ padding: "2rem", marginTop: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1.5rem", fontWeight: 700 }}>Request a Session</h3>

            {/* Session Type selector */}
            {(therapist.offers_child_therapy && therapist.offers_caregiver_training) && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: "0.5rem" }}>Session Type</label>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button onClick={() => setSessionType("child_therapy")}
                    style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", cursor: "pointer", fontWeight: 700,
                      background: sessionType === "child_therapy" ? "var(--primary)" : "var(--card)",
                      color: sessionType === "child_therapy" ? "white" : "var(--muted-foreground)",
                      border: `1px solid ${sessionType === "child_therapy" ? "var(--primary)" : "var(--border)"}`,
                    }}>
                    👶 Child Therapy
                  </button>
                  <button onClick={() => setSessionType("caregiver_1on1")}
                    style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", cursor: "pointer", fontWeight: 700,
                      background: sessionType === "caregiver_1on1" ? "var(--primary)" : "var(--card)",
                      color: sessionType === "caregiver_1on1" ? "white" : "var(--muted-foreground)",
                      border: `1px solid ${sessionType === "caregiver_1on1" ? "var(--primary)" : "var(--border)"}`,
                    }}>
                    🧑‍🏫 Caregiver Training
                  </button>
                </div>
              </div>
            )}

            {/* Mode selector */}
            {therapist.mode === "both" && (
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {["online", "offline"].map(m => (
                  <button key={m} onClick={() => setBookingMode(m)}
                    style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", cursor: "pointer", fontWeight: 700, textTransform: "capitalize",
                      background: bookingMode === m ? "var(--primary)" : "var(--card)",
                      color: bookingMode === m ? "white" : "var(--muted-foreground)",
                      border: `1px solid ${bookingMode === m ? "var(--primary)" : "var(--border)"}`,
                    }}>
                    {m === "online" ? "📹 Online" : "🏢 In-person"}
                    {fmt(m === "online" ? therapist.session_price_online : therapist.session_price_offline) &&
                      <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginTop: "0.2rem" }}>
                        {fmt(m === "online" ? therapist.session_price_online : therapist.session_price_offline)}
                      </span>
                    }
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gap: "1rem" }}>
              {[
                { label: "Your Name *", key: "parent_name", type: "text" },
                { label: "Your Email *", key: "parent_email", type: "email" },
                { label: "Phone Number", key: "parent_phone", type: "tel" },
              ].map(f => (
                <div key={f.key} style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--muted-foreground)" }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]}
                    onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))}
                    style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", outline: "none" }}
                  />
                </div>
              ))}
              
              {sessionType === "child_therapy" && (
                <>
                  <div style={{ display: "grid", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Child's Name</label>
                    <input type="text" value={form.child_name} onChange={e => setForm(f => ({ ...f, child_name: e.target.value }))} style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", outline: "none" }} />
                  </div>
                  <div style={{ display: "grid", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Child's Condition</label>
                    <input type="text" placeholder="e.g. Autism, Speech Delay" value={form.child_condition} onChange={e => setForm(f => ({ ...f, child_condition: e.target.value }))} style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", outline: "none" }} />
                  </div>
                </>
              )}

              <div style={{ display: "grid", gap: "1rem" }}>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Preferred Date *</label>
                  <input type="date" value={form.scheduled_date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value, scheduled_time: "" }))}
                    style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", outline: "none" }}
                  />
                </div>
                {form.scheduled_date && (
                  <div style={{ display: "grid", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Available Time Slots *</label>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {availableSlotsForDate.length > 0 ? availableSlotsForDate.map(slot => (
                        <button type="button" key={slot.start_time}
                          onClick={() => setForm(f => ({ ...f, scheduled_time: slot.start_time }))}
                          style={{ 
                            padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem",
                            border: `1px solid ${form.scheduled_time === slot.start_time ? "var(--primary)" : "var(--border)"}`, 
                            background: form.scheduled_time === slot.start_time ? "var(--primary)" : "var(--card)", 
                            color: form.scheduled_time === slot.start_time ? "white" : "var(--foreground)" 
                          }}
                        >
                          {slot.start_time} - {slot.end_time}
                        </button>
                      )) : (
                        <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", padding: "0.5rem 0" }}>
                          No slots available on this date for the selected session type. Please try another date.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Notes for Therapist</label>
                <textarea rows={3} placeholder="Share any context that will help the therapist prepare..."
                  value={form.parent_notes}
                  onChange={e => setForm(f => ({ ...f, parent_notes: e.target.value }))}
                  style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", resize: "vertical", outline: "none" }}
                />
              </div>
            </div>

            {price !== null && (
              <div style={{ margin: "1.25rem 0", padding: "1rem 1.25rem", background: "var(--muted)", borderRadius: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>Session fee ({therapist.session_duration_mins} min, {bookingMode})</span>
                <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)" }}>{fmt(price)}</span>
              </div>
            )}

            {error && (
              <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", color: "#f87171", borderRadius: "0.5rem", fontSize: "0.9rem", marginBottom: "1rem" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setShowBooking(false)}
                style={{ flex: 1, padding: "0.85rem", borderRadius: "0.75rem", background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleBook} disabled={submitting || !form.parent_name || !form.parent_email || !form.scheduled_date || !form.scheduled_time}
                style={{ flex: 2, padding: "0.85rem", borderRadius: "0.75rem", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 800, opacity: (submitting || !form.parent_name || !form.parent_email || !form.scheduled_date || !form.scheduled_time) ? 0.6 : 1 }}>
                {submitting ? "Sending Request..." : "Send Booking Request →"}
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
