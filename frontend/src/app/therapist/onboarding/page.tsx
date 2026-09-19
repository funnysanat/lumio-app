"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
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

const STEPS = ["Professional Details", "Specialisations", "Location & Pricing", "Availability"];

export default function TherapistOnboardingPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    specialisations: [] as string[],
    qualifications: [{ degree: "", institution: "", year: "" }],
    city: "",
    state: "",
    pincode: "",
    address: "",
    razorpay_account_id: "",
    min_age_months: "",
    max_age_months: "",
    availability: [
      { day_of_week: 1, start_time: "09:00", end_time: "17:00" }, // Mon
      { day_of_week: 2, start_time: "09:00", end_time: "17:00" }, // Tue
      { day_of_week: 3, start_time: "09:00", end_time: "17:00" }, // Wed
      { day_of_week: 4, start_time: "09:00", end_time: "17:00" }, // Thu
      { day_of_week: 5, start_time: "09:00", end_time: "17:00" }, // Fri
    ] as { day_of_week: number; start_time: string; end_time: string }[],
  });

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  const toggleDay = (day: number) => {
    setForm(f => {
      const exists = f.availability.find(a => a.day_of_week === day);
      if (exists) {
        return { ...f, availability: f.availability.filter(a => a.day_of_week !== day) };
      }
      return { ...f, availability: [...f.availability, { day_of_week: day, start_time: "09:00", end_time: "17:00" }] };
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // 1. Create therapist profile
      const profileRes = await fetch(`${API_URL}/api/v1/therapist/onboard`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || null,
          bio: form.bio || null,
          experience_years: Number(form.experience_years),
          languages: form.languages,
          mode: form.mode,
          session_duration_mins: Number(form.session_duration_mins),
          session_price_online: form.session_price_online ? Math.round(Number(form.session_price_online) * 100) : null,
          session_price_offline: form.session_price_offline ? Math.round(Number(form.session_price_offline) * 100) : null,
          specialisations: form.specialisations,
          qualifications: form.qualifications.filter(q => q.degree).map(q => ({
            degree: q.degree,
            institution: q.institution,
            year: q.year ? Number(q.year) : null,
          })),
          certifications: [],
          city: form.city || null,
          state: form.state || null,
          pincode: form.pincode || null,
          address: form.address || null,
          razorpay_account_id: form.razorpay_account_id || null,
          min_age_months: form.min_age_months ? Number(form.min_age_months) : null,
          max_age_months: form.max_age_months ? Number(form.max_age_months) : null,
        }),
      });

      if (!profileRes.ok) {
        const err = await profileRes.json();
        throw new Error(err.detail || "Failed to create profile.");
      }

      // 2. Set availability
      if (form.availability.length > 0) {
        await fetch(`${API_URL}/api/v1/therapist/availability`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ slots: form.availability }),
        });
      }

      router.push("/therapist/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return form.full_name.trim() && form.email.trim();
    if (step === 1) return form.specialisations.length > 0;
    return true;
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem" }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", marginBottom: "2rem" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="14" width="8" height="8" rx="2.5" fill="#38bdf8" />
          <rect x="13" y="14" width="8" height="8" rx="2.5" fill="#a78bfa" />
          <rect x="8" y="5" width="8" height="8" rx="2.5" fill="#f472b6" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--foreground)" }}>Lumio AI — Therapist Setup</span>
      </Link>

      {/* Step progress */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{
            padding: "0.4rem 1rem",
            borderRadius: "2rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            background: i === step ? "var(--primary)" : i < step ? "rgba(56,189,248,0.12)" : "var(--card)",
            color: i === step ? "white" : i < step ? "#38bdf8" : "var(--muted-foreground)",
            border: `1px solid ${i === step ? "var(--primary)" : "var(--border)"}`,
          }}>{i + 1}. {s}</div>
        ))}
      </div>

      <div className="card" style={{ width: "100%", maxWidth: "620px", padding: "2rem" }}>
        {/* Step 0: Professional Details */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 style={{ margin: 0 }}>Tell us about yourself</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              {[
                { label: "Full Name *", key: "full_name", type: "text", placeholder: "Dr. Priya Sharma" },
                { label: "Email Address *", key: "email", type: "email", placeholder: "priya@example.com" },
                { label: "Phone Number", key: "phone", type: "tel", placeholder: "+91 98765 43210" },
              ].map(f => (
                <div key={f.key} style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontSize: "0.95rem", outline: "none", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Years of Experience</label>
                <input type="number" min="0" max="50" value={form.experience_years}
                  onChange={e => setForm(f => ({ ...f, experience_years: Number(e.target.value) }))}
                  style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", width: "120px", outline: "none" }}
                />
              </div>
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Short Bio</label>
                <textarea
                  rows={3}
                  placeholder="I specialise in ABA therapy and early intervention for children with autism..."
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontSize: "0.95rem", resize: "vertical", outline: "none", width: "100%", boxSizing: "border-box" }}
                />
              </div>
              {/* Qualifications */}
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Qualifications</label>
                {form.qualifications.map((q, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: "0.5rem" }}>
                    <input placeholder="Degree (e.g. M.Sc SLP)" value={q.degree}
                      onChange={e => setForm(f => { const qs = [...f.qualifications]; qs[i] = { ...qs[i], degree: e.target.value }; return { ...f, qualifications: qs }; })}
                      style={{ padding: "0.6rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontSize: "0.85rem", outline: "none" }}
                    />
                    <input placeholder="Institution" value={q.institution}
                      onChange={e => setForm(f => { const qs = [...f.qualifications]; qs[i] = { ...qs[i], institution: e.target.value }; return { ...f, qualifications: qs }; })}
                      style={{ padding: "0.6rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontSize: "0.85rem", outline: "none" }}
                    />
                    <input placeholder="Year" value={q.year}
                      onChange={e => setForm(f => { const qs = [...f.qualifications]; qs[i] = { ...qs[i], year: e.target.value }; return { ...f, qualifications: qs }; })}
                      style={{ padding: "0.6rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontSize: "0.85rem", outline: "none" }}
                    />
                  </div>
                ))}
                <button onClick={() => setForm(f => ({ ...f, qualifications: [...f.qualifications, { degree: "", institution: "", year: "" }] }))}
                  style={{ alignSelf: "flex-start", background: "none", border: "1px dashed var(--border)", borderRadius: "0.5rem", color: "var(--primary)", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.82rem" }}>
                  + Add Qualification
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Specialisations & Languages */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 style={{ margin: 0 }}>Your specialisations</h2>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: "0.75rem" }}>Conditions you specialise in *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {SPECIALISATIONS.map(s => (
                  <button key={s.value} onClick={() => toggleSpec(s.value)}
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
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: "0.75rem" }}>Languages</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {LANGUAGES.map(l => (
                  <button key={l} onClick={() => toggleLang(l)}
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
          </div>
        )}

        {/* Step 2: Location & Pricing */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 style={{ margin: 0 }}>Location & Pricing</h2>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: "0.75rem" }}>Session Mode</label>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {MODES.map(m => (
                  <button key={m.value} onClick={() => setForm(f => ({ ...f, mode: m.value }))}
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {(form.mode === "online" || form.mode === "both") && (
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Online Session Price (₹)</label>
                  <input type="number" placeholder="1500" value={form.session_price_online}
                    onChange={e => setForm(f => ({ ...f, session_price_online: e.target.value }))}
                    style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", outline: "none" }}
                  />
                </div>
              )}
              {(form.mode === "offline" || form.mode === "both") && (
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>In-Person Session Price (₹)</label>
                  <input type="number" placeholder="2000" value={form.session_price_offline}
                    onChange={e => setForm(f => ({ ...f, session_price_offline: e.target.value }))}
                    style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", outline: "none" }}
                  />
                </div>
              )}
            </div>
            <div style={{ display: "grid", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Session Duration (minutes)</label>
              <select value={form.session_duration_mins}
                onChange={e => setForm(f => ({ ...f, session_duration_mins: Number(e.target.value) }))}
                style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", width: "160px", outline: "none" }}>
                {[30, 45, 60, 90].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            
            <div style={{ display: "grid", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Razorpay Route Account ID</label>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "var(--muted-foreground)" }}>To receive automatic session payouts (88% split). Leave blank for testing/MVP.</p>
              <input type="text" placeholder="acc_..." value={form.razorpay_account_id}
                onChange={e => setForm(f => ({ ...f, razorpay_account_id: e.target.value }))}
                style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", outline: "none" }}
              />
            </div>
            
            {(form.mode === "offline" || form.mode === "both") && (
              <div style={{ display: "grid", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  {[
                    { label: "City", key: "city", placeholder: "Bengaluru" },
                    { label: "State", key: "state", placeholder: "Karnataka" },
                    { label: "Pincode", key: "pincode", placeholder: "560001" },
                  ].map(f => (
                    <div key={f.key} style={{ display: "grid", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>{f.label}</label>
                      <input placeholder={f.placeholder} value={(form as any)[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", outline: "none" }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted-foreground)" }}>Clinic/Practice Address</label>
                  <textarea rows={2} placeholder="123 MG Road, Bengaluru..." value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", resize: "vertical", outline: "none" }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Availability */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 style={{ margin: 0 }}>Your weekly availability</h2>
            <p style={{ color: "var(--muted-foreground)", margin: 0, fontSize: "0.9rem" }}>
              Select the days and hours you are available for sessions. You can update this anytime from your dashboard.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {days.map((day, idx) => {
                const slot = form.availability.find(a => a.day_of_week === idx);
                const isActive = !!slot;
                return (
                  <div key={day} style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "0.75rem 1rem", borderRadius: "0.75rem",
                    border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                    background: isActive ? "rgba(99,102,241,0.06)" : "var(--card)",
                  }}>
                    <button onClick={() => toggleDay(idx)} style={{
                      width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer",
                      background: isActive ? "var(--primary)" : "transparent",
                      border: `2px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                      color: "white", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0,
                    }}>{isActive ? "✓" : ""}</button>
                    <span style={{ width: "36px", fontWeight: 700, color: isActive ? "var(--foreground)" : "var(--muted-foreground)", flexShrink: 0 }}>{day}</span>
                    {isActive && (
                      <>
                        <input type="time" value={slot?.start_time || "09:00"}
                          onChange={e => setForm(f => ({ ...f, availability: f.availability.map(a => a.day_of_week === idx ? { ...a, start_time: e.target.value } : a) }))}
                          style={{ padding: "0.4rem 0.6rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", outline: "none" }}
                        />
                        <span style={{ color: "var(--muted-foreground)" }}>to</span>
                        <input type="time" value={slot?.end_time || "17:00"}
                          onChange={e => setForm(f => ({ ...f, availability: f.availability.map(a => a.day_of_week === idx ? { ...a, end_time: e.target.value } : a) }))}
                          style={{ padding: "0.4rem 0.6rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", outline: "none" }}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", color: "#f87171", borderRadius: "0.5rem", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              style={{ padding: "0.75rem 1.5rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", cursor: "pointer", fontWeight: 600 }}>
              ← Back
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              style={{ padding: "0.75rem 1.5rem", borderRadius: "0.75rem", background: canNext() ? "var(--primary)" : "var(--muted)", color: "white", border: "none", cursor: canNext() ? "pointer" : "not-allowed", fontWeight: 700 }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              style={{ padding: "0.75rem 2rem", borderRadius: "0.75rem", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>
              {saving ? "Setting up your profile..." : "Complete Setup ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
