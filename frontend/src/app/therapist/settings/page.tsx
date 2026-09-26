"use client";

import { useState, useEffect } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SPECIALISATIONS = [
  { value: "autism", label: "Autism (ASD)" },
  { value: "speech_delay", label: "Speech & Language Delay" },
  { value: "adhd", label: "ADHD" },
  { value: "cerebral_palsy", label: "Cerebral Palsy" },
  { value: "down_syndrome", label: "Down Syndrome" },
  { value: "learning_disability", label: "Learning Disability" },
  { value: "intellectual_disability", label: "Intellectual Disability" },
  { value: "sensory_processing", label: "Sensory Processing" },
  { value: "behavioural", label: "Behavioural Concerns" },
  { value: "motor_delay", label: "Motor Delay" },
];

const LANGUAGES = ["English", "Hindi", "Kannada", "Tamil", "Telugu", "Malayalam", "Marathi", "Bengali", "Gujarati"];
const MODES = [
  { value: "online", label: "Online only" },
  { value: "offline", label: "In-person only" },
  { value: "both", label: "Both online & in-person" },
];

export default function TherapistSettingsPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    bio: "",
    experience_years: 0,
    languages: ["English"] as string[],
    mode: "both",
    session_duration_mins: 60,
    session_price_online: "",
    session_price_offline: "",
    offers_child_therapy: true,
    offers_caregiver_training: false,
    offers_group_training: false,
    caregiver_price_online: "",
    caregiver_price_offline: "",
    group_price_online: "",
    group_price_offline: "",
    specialisations: [] as string[],
    qualifications: [{ degree: "", institution: "", year: "" }],
    city: "",
    state: "",
    pincode: "",
    address: "",
    razorpay_account_id: "",
    min_age_months: "",
    max_age_months: "",
    availability: [] as { day_of_week: number; start_time: string; end_time: string; session_type: string }[],
  });

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_URL}/api/v1/therapist/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setForm({
            full_name: data.full_name || "",
            email: data.email || "",
            phone: data.phone || "",
            bio: data.bio || "",
            experience_years: data.experience_years || 0,
            languages: data.languages || ["English"],
            mode: data.mode || "both",
            session_duration_mins: data.session_duration_mins || 60,
            session_price_online: data.session_price_online ? (data.session_price_online / 100).toString() : "",
            session_price_offline: data.session_price_offline ? (data.session_price_offline / 100).toString() : "",
            offers_child_therapy: data.offers_child_therapy !== false, // default true
            offers_caregiver_training: data.offers_caregiver_training || false,
            offers_group_training: data.offers_group_training || false,
            caregiver_price_online: data.caregiver_price_online ? (data.caregiver_price_online / 100).toString() : "",
            caregiver_price_offline: data.caregiver_price_offline ? (data.caregiver_price_offline / 100).toString() : "",
            group_price_online: data.group_price_online ? (data.group_price_online / 100).toString() : "",
            group_price_offline: data.group_price_offline ? (data.group_price_offline / 100).toString() : "",
            specialisations: data.specialisations || [],
            qualifications: data.qualifications?.length > 0 ? data.qualifications : [{ degree: "", institution: "", year: "" }],
            city: data.city || "",
            state: data.state || "",
            pincode: data.pincode || "",
            address: data.address || "",
            razorpay_account_id: data.razorpay_account_id || "",
            min_age_months: data.min_age_months || "",
            max_age_months: data.max_age_months || "",
            availability: (data.availability || []).map((a: any) => ({
              day_of_week: a.day_of_week,
              start_time: a.start_time,
              end_time: a.end_time,
              session_type: a.session_type || "child_therapy"
            })),
          });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [getToken]);

  const toggleSpec = (v: string) => {
    setForm(f => ({
      ...f,
      specialisations: f.specialisations.includes(v)
        ? f.specialisations.filter(s => s !== v)
        : [...f.specialisations, v],
    }));
  };

  const toggleLang = (v: string) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(v)
        ? f.languages.filter(l => l !== v)
        : [...f.languages, v],
    }));
  };

  const addSlot = (day: number) => {
    setForm(f => ({
      ...f,
      availability: [...f.availability, { day_of_week: day, start_time: "09:00", end_time: "10:00", session_type: "child_therapy" }]
    }));
  };

  const removeSlot = (indexToRemove: number) => {
    setForm(f => ({
      ...f,
      availability: f.availability.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const updateSlot = (indexToUpdate: number, field: string, value: string) => {
    setForm(f => ({
      ...f,
      availability: f.availability.map((a, idx) => 
        idx === indexToUpdate ? { ...a, [field]: value } : a
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // 1. Update therapist profile
      const profileRes = await fetch(`${API_URL}/api/v1/therapist/me`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone || null,
          bio: form.bio || null,
          experience_years: Number(form.experience_years),
          languages: form.languages,
          mode: form.mode,
          session_duration_mins: Number(form.session_duration_mins),
          session_price_online: form.session_price_online ? Math.round(Number(form.session_price_online) * 100) : null,
          session_price_offline: form.session_price_offline ? Math.round(Number(form.session_price_offline) * 100) : null,
          offers_child_therapy: form.offers_child_therapy,
          offers_caregiver_training: form.offers_caregiver_training,
          offers_group_training: form.offers_group_training,
          caregiver_price_online: form.caregiver_price_online ? Math.round(Number(form.caregiver_price_online) * 100) : null,
          caregiver_price_offline: form.caregiver_price_offline ? Math.round(Number(form.caregiver_price_offline) * 100) : null,
          group_price_online: form.group_price_online ? Math.round(Number(form.group_price_online) * 100) : null,
          group_price_offline: form.group_price_offline ? Math.round(Number(form.group_price_offline) * 100) : null,
          specialisations: form.specialisations,
          qualifications: form.qualifications.filter(q => q.degree).map(q => ({
            degree: q.degree,
            institution: q.institution,
            year: q.year ? Number(q.year) : null,
          })),
          city: form.city || null,
          state: form.state || null,
          pincode: form.pincode || null,
          address: form.address || null,
          razorpay_account_id: form.razorpay_account_id || null,
        }),
      });

      if (!profileRes.ok) {
        const err = await profileRes.json();
        throw new Error(err.detail || "Failed to update profile.");
      }

      // 2. Set availability
      await fetch(`${API_URL}/api/v1/therapist/availability`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ slots: form.availability }),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/therapist/dashboard");
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", padding: "4rem", textAlign: "center", color: "var(--muted-foreground)" }}>Loading your profile...</div>;
  }

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
          <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>/ Edit Profile</span>
        </Link>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/therapist/dashboard" style={{ padding: "0.5rem 1rem", borderRadius: "2rem", border: "1px solid var(--border)", background: "white", color: "var(--foreground)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
            ← Back to Dashboard
          </Link>
          <UserButton />
        </div>
      </div>

      <div className="card" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
        <h1 style={{ margin: "0 0 2rem 0", fontSize: "1.8rem" }}>Edit Profile</h1>
        
        {error && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: "0.5rem" }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(34,197,94,0.1)", color: "#22c55e", borderRadius: "0.5rem" }}>
            Profile updated successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          
          {/* Section 1: Professional Details */}
          <div>
            <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Professional Details</h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Full Name</label>
                <input type="text" required value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
              </div>
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
              </div>
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Bio</label>
                <textarea rows={3} value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Years of Experience</label>
                <input type="number" min="0" value={form.experience_years} onChange={e => setForm(f => ({...f, experience_years: Number(e.target.value)}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", width: "120px" }} />
              </div>
            </div>
          </div>

          {/* Section 2: Specialisations */}
          <div>
            <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Specialisations</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {SPECIALISATIONS.map(s => (
                <button type="button" key={s.value} onClick={() => toggleSpec(s.value)}
                  style={{
                    padding: "0.5rem 1rem", borderRadius: "2rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                    background: form.specialisations.includes(s.value) ? "var(--primary)" : "var(--card)",
                    color: form.specialisations.includes(s.value) ? "white" : "var(--muted-foreground)",
                    border: `1px solid ${form.specialisations.includes(s.value) ? "var(--primary)" : "var(--border)"}`,
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
            
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: "0.75rem" }}>Languages</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {LANGUAGES.map(l => (
                <button type="button" key={l} onClick={() => toggleLang(l)}
                  style={{
                    padding: "0.5rem 1rem", borderRadius: "2rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                    background: form.languages.includes(l) ? "rgba(56,189,248,0.15)" : "var(--card)",
                    color: form.languages.includes(l) ? "#38bdf8" : "var(--muted-foreground)",
                    border: `1px solid ${form.languages.includes(l) ? "#38bdf8" : "var(--border)"}`,
                  }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Pricing & Location */}
          <div>
            <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Location & Pricing</h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: "0.5rem" }}>Session Mode</label>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {MODES.map(m => (
                    <button type="button" key={m.value} onClick={() => setForm(f => ({ ...f, mode: m.value }))}
                      style={{
                        padding: "0.6rem 1.25rem", borderRadius: "2rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                        background: form.mode === m.value ? "var(--primary)" : "var(--card)",
                        color: form.mode === m.value ? "white" : "var(--muted-foreground)",
                        border: `1px solid ${form.mode === m.value ? "var(--primary)" : "var(--border)"}`,
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gap: "1rem" }}>
                {/* Child Therapy Pricing */}
                <div style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem", background: "rgba(255,255,255,0.02)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, cursor: "pointer", marginBottom: "1rem" }}>
                    <input type="checkbox" checked={form.offers_child_therapy} onChange={e => setForm(f => ({ ...f, offers_child_therapy: e.target.checked }))} />
                    Child Therapy (1-on-1)
                  </label>
                  {form.offers_child_therapy && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      {(form.mode === "online" || form.mode === "both") && (
                        <div style={{ display: "grid", gap: "0.4rem" }}>
                          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Online Price (₹)</label>
                          <input type="number" value={form.session_price_online} onChange={e => setForm(f => ({ ...f, session_price_online: e.target.value }))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                        </div>
                      )}
                      {(form.mode === "offline" || form.mode === "both") && (
                        <div style={{ display: "grid", gap: "0.4rem" }}>
                          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>In-Person Price (₹)</label>
                          <input type="number" value={form.session_price_offline} onChange={e => setForm(f => ({ ...f, session_price_offline: e.target.value }))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Caregiver 1-on-1 Pricing */}
                <div style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem", background: "rgba(255,255,255,0.02)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, cursor: "pointer", marginBottom: form.offers_caregiver_training ? "1rem" : "0" }}>
                    <input type="checkbox" checked={form.offers_caregiver_training} onChange={e => setForm(f => ({ ...f, offers_caregiver_training: e.target.checked }))} />
                    Caregiver Training (1-on-1)
                  </label>
                  {form.offers_caregiver_training && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      {(form.mode === "online" || form.mode === "both") && (
                        <div style={{ display: "grid", gap: "0.4rem" }}>
                          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Online Price (₹)</label>
                          <input type="number" value={form.caregiver_price_online} onChange={e => setForm(f => ({ ...f, caregiver_price_online: e.target.value }))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                        </div>
                      )}
                      {(form.mode === "offline" || form.mode === "both") && (
                        <div style={{ display: "grid", gap: "0.4rem" }}>
                          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>In-Person Price (₹)</label>
                          <input type="number" value={form.caregiver_price_offline} onChange={e => setForm(f => ({ ...f, caregiver_price_offline: e.target.value }))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Group Training Pricing */}
                <div style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem", background: "rgba(255,255,255,0.02)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, cursor: "pointer", marginBottom: form.offers_group_training ? "1rem" : "0" }}>
                    <input type="checkbox" checked={form.offers_group_training} onChange={e => setForm(f => ({ ...f, offers_group_training: e.target.checked }))} />
                    Group Training (Workshops)
                  </label>
                  {form.offers_group_training && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      {(form.mode === "online" || form.mode === "both") && (
                        <div style={{ display: "grid", gap: "0.4rem" }}>
                          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Online Ticket Price (₹)</label>
                          <input type="number" value={form.group_price_online} onChange={e => setForm(f => ({ ...f, group_price_online: e.target.value }))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                        </div>
                      )}
                      {(form.mode === "offline" || form.mode === "both") && (
                        <div style={{ display: "grid", gap: "0.4rem" }}>
                          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>In-Person Ticket Price (₹)</label>
                          <input type="number" value={form.group_price_offline} onChange={e => setForm(f => ({ ...f, group_price_offline: e.target.value }))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Duration (minutes)</label>
                <select value={form.session_duration_mins} onChange={e => setForm(f => ({ ...f, session_duration_mins: Number(e.target.value) }))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", width: "160px" }}>
                  {[30, 45, 60, 90].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Razorpay Account ID</label>
                <input type="text" value={form.razorpay_account_id} onChange={e => setForm(f => ({ ...f, razorpay_account_id: e.target.value }))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
              </div>
              
              <div style={{ borderTop: "1px solid var(--border)", margin: "1rem 0" }}></div>
              
              <h4 style={{ fontSize: "1rem", fontWeight: 600 }}>Location Details</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Adding your location helps parents find therapists near them.</p>
              
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Clinic/Practice Address</label>
                <textarea rows={2} value={form.address || ""} onChange={e => setForm(f => ({...f, address: e.target.value}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>City</label>
                  <input type="text" value={form.city || ""} onChange={e => setForm(f => ({...f, city: e.target.value}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                </div>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>State</label>
                  <input type="text" value={form.state || ""} onChange={e => setForm(f => ({...f, state: e.target.value}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                </div>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Pincode</label>
                  <input type="text" value={form.pincode || ""} onChange={e => setForm(f => ({...f, pincode: e.target.value}))} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Availability */}
          <div>
            <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Availability</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
              Define explicit slots for each day. Parents can book directly into these slots. Make sure the slot length matches your global Session Duration ({form.session_duration_mins} mins).
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {days.map((day, dayIdx) => {
                const slots = form.availability.filter(a => a.day_of_week === dayIdx);
                return (
                  <div key={day} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div style={{ width: "40px", fontWeight: 700, color: slots.length > 0 ? "var(--foreground)" : "var(--muted-foreground)", paddingTop: "0.75rem" }}>
                      {day}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                      {slots.length === 0 ? (
                        <div style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", padding: "0.75rem", border: "1px dashed var(--border)", borderRadius: "0.5rem", textAlign: "center" }}>
                          No slots assigned
                        </div>
                      ) : (
                        slots.map((slot, slotIndexInDay) => {
                          // Find global index to update/remove
                          const globalIdx = form.availability.findIndex(
                            a => a.day_of_week === dayIdx && a.start_time === slot.start_time && a.end_time === slot.end_time && a.session_type === slot.session_type
                          );
                          return (
                            <div key={globalIdx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--card)", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", flexWrap: "wrap" }}>
                              <input type="time" value={slot.start_time}
                                onChange={e => updateSlot(globalIdx, "start_time", e.target.value)}
                                style={{ padding: "0.4rem", borderRadius: "0.4rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", outline: "none" }}
                              />
                              <span style={{ color: "var(--muted-foreground)" }}>to</span>
                              <input type="time" value={slot.end_time}
                                onChange={e => updateSlot(globalIdx, "end_time", e.target.value)}
                                style={{ padding: "0.4rem", borderRadius: "0.4rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", outline: "none" }}
                              />
                              <select 
                                value={slot.session_type} 
                                onChange={e => updateSlot(globalIdx, "session_type", e.target.value)}
                                style={{ padding: "0.4rem", borderRadius: "0.4rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", outline: "none", flex: 1, minWidth: "150px" }}
                              >
                                <option value="child_therapy">Child Therapy</option>
                                <option value="caregiver_1on1">Caregiver 1-on-1</option>
                                <option value="caregiver_group">Caregiver Group</option>
                              </select>
                              <button type="button" onClick={() => removeSlot(globalIdx)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }}>
                                &times;
                              </button>
                            </div>
                          );
                        })
                      )}
                      <button type="button" onClick={() => addSlot(dayIdx)} style={{
                        background: "rgba(255,255,255,0.05)", border: "1px dashed var(--border)", padding: "0.5rem", borderRadius: "0.5rem", cursor: "pointer", color: "var(--muted-foreground)", fontSize: "0.85rem",
                        width: "100px", textAlign: "center", alignSelf: "flex-start"
                      }}>
                        + Add Slot
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
            <button type="button" onClick={() => router.push('/therapist/dashboard')} style={{ padding: "0.75rem 2rem", borderRadius: "0.5rem", background: "transparent", color: "var(--foreground)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: "0.75rem 2rem", borderRadius: "0.5rem", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
