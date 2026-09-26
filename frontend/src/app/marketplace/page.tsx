"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
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
  city: string | null;
  state: string | null;
  address?: string | null;
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  total_sessions: number;
  match_score: number | null;
  total_videos?: number;
  total_video_views?: number;
  availability: { id: string; day_of_week: number; start_time: string; end_time: string }[];
  distance_km?: number | null;
};

const SPEC_LABELS: Record<string, string> = {
  autism: "Autism", speech_delay: "Speech Delay", adhd: "ADHD",
  cerebral_palsy: "Cerebral Palsy", down_syndrome: "Down Syndrome",
  learning_disability: "Learning Disability", intellectual_disability: "Intellectual Disability",
  sensory_processing: "Sensory Processing", behavioural: "Behavioural", motor_delay: "Motor Delay",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const fmt = (paise: number | null) => paise ? `₹${(paise / 100).toLocaleString("en-IN")}` : null;

export default function MarketplacePage() {
  const { getToken } = useAuth();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [mode, setMode] = useState("");
  const [spec, setSpec] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchTherapists = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setSkip(0);
    } else {
      setLoadingMore(true);
    }
    const currentSkip = reset ? 0 : skip;
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (city.trim()) params.set("city", city.trim());
      if (address.trim()) params.set("address", address.trim());
      if (pincode.trim()) params.set("pincode", pincode.trim());
      if (mode) params.set("mode", mode);
      if (spec) params.set("specialisation", spec);
      params.set("skip", currentSkip.toString());
      params.set("limit", limit.toString());
      
      const res = await fetch(`${API_URL}/api/v1/marketplace/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (reset) {
        setTherapists(data);
      } else {
        setTherapists(prev => [...prev, ...data]);
      }
      setHasMore(data.length === limit);
      if (!reset) {
        setSkip(prev => prev + limit);
      } else if (data.length === limit) {
        setSkip(limit);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [city, address, pincode, mode, spec, skip, getToken, API_URL]);
  useEffect(() => {
    let mounted = true;
    const fetchProfileLocation = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API_URL}/api/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && mounted) {
          const user = await res.json();
          if (user.city) setCity(user.city);
          if (user.address) setAddress(user.address);
          if (user.pincode) setPincode(user.pincode);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfileLocation();
    return () => { mounted = false; };
  }, [getToken, API_URL]);


  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTherapists(true);
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, address, pincode, mode, spec]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "4rem" }}>
      {/* Hero header */}
      <div style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(56,189,248,0.08) 100%)",
        borderBottom: "1px solid var(--border)",
        padding: "3rem 2rem 2rem",
        textAlign: "center",
      }}>
        <h1 style={{ margin: "0 0 0.5rem", fontWeight: 800, fontSize: "2.25rem", lineHeight: 1.2 }}>
          Find a Therapist
        </h1>
        <p style={{ margin: "0 auto 2rem", color: "var(--muted-foreground)", maxWidth: "500px", lineHeight: 1.6 }}>
          Verified specialists matched to your child's profile. Book online or in-person sessions directly.
        </p>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", maxWidth: "900px", margin: "0 auto" }}>
          <input
            placeholder="🏙 City"
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchTherapists()}
            style={{ padding: "0.75rem 1.25rem", borderRadius: "2rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", outline: "none", fontSize: "0.95rem", minWidth: "120px", flex: 1 }}
          />
          <input
            placeholder="📍 Address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchTherapists()}
            style={{ padding: "0.75rem 1.25rem", borderRadius: "2rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", outline: "none", fontSize: "0.95rem", minWidth: "150px", flex: 2 }}
          />
          <input
            placeholder="📮 Pincode"
            value={pincode}
            onChange={e => setPincode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchTherapists()}
            style={{ padding: "0.75rem 1.25rem", borderRadius: "2rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", outline: "none", fontSize: "0.95rem", minWidth: "100px", flex: 1 }}
          />
          <select value={mode} onChange={e => setMode(e.target.value)}
            style={{ padding: "0.75rem 1.25rem", borderRadius: "2rem", border: "1px solid var(--border)", background: "var(--card)", color: mode ? "var(--foreground)" : "var(--muted-foreground)", outline: "none", fontSize: "0.95rem", cursor: "pointer" }}>
            <option value="">All modes</option>
            <option value="online">Online</option>
            <option value="offline">In-person</option>
          </select>
          <select value={spec} onChange={e => setSpec(e.target.value)}
            style={{ padding: "0.75rem 1.25rem", borderRadius: "2rem", border: "1px solid var(--border)", background: "var(--card)", color: spec ? "var(--foreground)" : "var(--muted-foreground)", outline: "none", fontSize: "0.95rem", cursor: "pointer" }}>
            <option value="">All specialisations</option>
            {Object.entries(SPEC_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={() => fetchTherapists(true)}
            style={{ padding: "0.75rem 1.5rem", borderRadius: "2rem", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem" }}>
            Search
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--muted-foreground)" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
            <p>Finding therapists for your child...</p>
          </div>
        ) : therapists.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
            <h3 style={{ margin: "0 0 0.5rem" }}>No therapists found</h3>
            <p style={{ color: "var(--muted-foreground)" }}>Try adjusting your filters or searching a different city.</p>
          </div>
        ) : (
          <>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem", marginBottom: "1.25rem", fontWeight: 600 }}>
              {therapists.length} therapist{therapists.length !== 1 ? "s" : ""} found
              {therapists[0]?.match_score !== null ? " · sorted by match score" : ""}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {therapists.map((t, i) => (
                <TherapistCard key={`${t.id}-${i}`} therapist={t} />
              ))}
            </div>
            
            {hasMore && (
              <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <button 
                  onClick={() => fetchTherapists(false)} 
                  disabled={loadingMore}
                  style={{ padding: "0.75rem 2rem", borderRadius: "2rem", background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}>
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function TherapistCard({ therapist: t }: { therapist: Therapist }) {
  const scorePercent = t.match_score !== null ? Math.round(t.match_score * 100) : null;
  const availDays = t.availability.map(a => DAYS[a.day_of_week]);

  return (
    <Link href={`/marketplace/${t.id}`} style={{ textDecoration: "none" }}>
      <div className="card" style={{
        padding: "1.5rem",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: "1.25rem",
        alignItems: "start",
        transition: "border-color 0.2s, box-shadow 0.2s",
        cursor: "pointer",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(99,102,241,0.12)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
      >
        {/* Avatar */}
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%", overflow: "hidden", flexShrink: 0,
          background: "linear-gradient(135deg, #6366f1, #38bdf8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.5rem", fontWeight: 800, color: "white",
        }}>
          {t.profile_photo_url
            ? <img src={t.profile_photo_url} alt={t.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : t.full_name.charAt(0).toUpperCase()
          }
        </div>

        {/* Info */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
            <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--foreground)" }}>{t.full_name}</span>
            {t.is_verified && (
              <span style={{ background: "rgba(56,189,248,0.12)", color: "#38bdf8", fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "2rem", border: "1px solid rgba(56,189,248,0.3)" }}>
                ✓ Verified
              </span>
            )}
          </div>

          {/* Specialisations */}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            {t.specialisations.slice(0, 4).map(s => (
              <span key={s} style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: "2rem" }}>
                {SPEC_LABELS[s] || s}
              </span>
            ))}
            {t.specialisations.length > 4 && (
              <span style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: "2rem" }}>
                +{t.specialisations.length - 4}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.83rem", color: "var(--muted-foreground)", flexWrap: "wrap" }}>
            <span>🎓 {t.experience_years}y exp</span>
            {(t.city || t.address) && (
              <span>
                📍 {t.address ? `${t.address}, ` : ""}{t.city} {t.distance_km !== undefined && t.distance_km !== null ? `(${t.distance_km < 1 ? "< 1" : Math.round(t.distance_km)} km away)` : ""}
              </span>
            )}
            <span>🗣 {t.languages.slice(0, 2).join(", ")}</span>
            {t.avg_rating > 0 && <span>⭐ {t.avg_rating.toFixed(1)} ({t.total_reviews})</span>}
            {availDays.length > 0 && <span>📅 {availDays.join(", ")}</span>}
            {(t.total_videos || 0) > 0 && (
              <span style={{ color: "#ec4899", fontWeight: 700 }}>
                🎥 {t.total_videos} Videos (👁️ {t.total_video_views} views)
              </span>
            )}
            
            {(t.offers_caregiver_training || t.offers_group_training) && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {t.offers_caregiver_training && (
                  <span style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "2rem" }}>
                    🧑‍🏫 Caregiver Training
                  </span>
                )}
                {t.offers_group_training && (
                  <span style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "2rem" }}>
                    👥 Workshops
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column — price + match */}
        <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
          {scorePercent !== null && (
            <div style={{
              background: scorePercent >= 70 ? "rgba(34,197,94,0.12)" : scorePercent >= 40 ? "rgba(245,158,11,0.12)" : "rgba(107,114,128,0.1)",
              color: scorePercent >= 70 ? "#22c55e" : scorePercent >= 40 ? "#f59e0b" : "#6b7280",
              fontSize: "0.78rem", fontWeight: 800, padding: "0.25rem 0.6rem", borderRadius: "2rem",
              border: `1px solid ${scorePercent >= 70 ? "rgba(34,197,94,0.3)" : scorePercent >= 40 ? "rgba(245,158,11,0.3)" : "rgba(107,114,128,0.2)"}`,
            }}>
              {scorePercent}% match
            </div>
          )}
          {fmt(t.session_price_online) && (
            <div style={{ fontWeight: 800, color: "var(--foreground)", fontSize: "1rem" }}>
              {fmt(t.session_price_online)}
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)" }}>/session</span>
            </div>
          )}
          <span style={{
            fontSize: "0.78rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "2rem", textTransform: "capitalize",
            background: t.mode === "online" ? "rgba(56,189,248,0.1)" : t.mode === "offline" ? "rgba(167,139,250,0.1)" : "rgba(99,102,241,0.08)",
            color: t.mode === "online" ? "#38bdf8" : t.mode === "offline" ? "#a78bfa" : "var(--primary)",
          }}>
            {t.mode === "both" ? "Online & In-person" : t.mode}
          </span>
        </div>
      </div>
    </Link>
  );
}
