"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

type Consultation = {
  id: string;
  question_text: string;
  status: string;
  price_inr: number;
  answer_text: string | null;
  created_at: string;
  therapist?: {
    id: string;
    specialty: string;
    user: {
      first_name: string;
      last_name: string;
    }
  } | null;
};

export default function AskQuestionPage() {
  const { getToken } = useAuth();
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchMyConsultations = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/consultations/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setConsultations(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyConsultations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/consultations/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ question_text: question })
      });
      
      if (res.ok) {
        setQuestion("");
        alert("Payment successful! Your question has been submitted to the queue.");
        fetchMyConsultations();
      } else {
        alert("Failed to submit question.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "4rem" }}>
      <div style={{
        background: "var(--card)",
        borderBottom: "1px solid var(--border)",
        padding: "4rem 2rem",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{ margin: "0 0 1rem", fontWeight: 800, fontSize: "3rem", letterSpacing: "-0.03em", color: "var(--foreground)" }}>
            Ask a Therapist
          </h1>
          <p style={{ margin: "0 auto", color: "var(--muted-foreground)", fontSize: "1.1rem", lineHeight: 1.6, maxWidth: "600px" }}>
            Get fast answers to specific questions. Submit a question and receive a detailed, personalized answer from a verified therapist for ₹199.
          </p>
        </div>
      </div>

      <main className="container-lg" style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Left Column: Ask Form */}
        <div>
          <div className="card">
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 1rem 0" }}>Submit a New Question</h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Have a specific doubt or concern? Ask our network of verified pediatric therapists. The first available expert will review and answer it!
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Your Question</label>
                <textarea
                  className="form-input"
                  rows={5}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., My 4-year-old refuses to eat anything green, what sensory strategies can I use?"
                  required
                />
              </div>
              
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  <span style={{ color: "#64748b" }}>Consultation Fee</span>
                  <span style={{ fontWeight: 600 }}>₹199</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.9rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
                  <span style={{ color: "#64748b" }}>Platform Fee (5%)</span>
                  <span style={{ fontWeight: 600 }}>₹10</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>₹209</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>Usually answered within 2-4 hours.</div>
              </div>

              <button 
                type="submit" 
                disabled={submitting || !question.trim()}
                style={{ width: "100%", padding: "1rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "0.75rem", fontSize: "1rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? "Processing Payment..." : "Pay ₹209 & Ask Question"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: History */}
        <div>
          <h2 style={{ fontSize: "1.25rem", margin: "0 0 1rem 0" }}>My Consultations</h2>
          
          {loading ? (
            <div>Loading...</div>
          ) : consultations.length === 0 ? (
            <div className="card" style={{ textAlign: "center", color: "var(--muted-foreground)", padding: "3rem 1rem" }}>
              You haven't asked any questions yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {consultations.map(c => (
                <div key={c.id} className="card" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <span style={{ 
                      padding: "0.25rem 0.5rem", 
                      borderRadius: "0.25rem", 
                      fontSize: "0.75rem", 
                      fontWeight: 700,
                      background: c.status === "answered" ? "#dcfce7" : c.status === "claimed" ? "#fef3c7" : "#e0e7ff",
                      color: c.status === "answered" ? "#166534" : c.status === "claimed" ? "#92400e" : "#3730a3"
                    }}>
                      {c.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div style={{ fontWeight: 500, marginBottom: "1rem", color: "var(--foreground)" }}>
                    Q: {c.question_text}
                  </div>
                  
                  {c.status === "answered" && c.answer_text && c.therapist ? (
                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "0.5rem", borderLeft: "4px solid var(--primary)" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--primary)" }}>
                        Answered by {c.therapist.user.first_name} {c.therapist.user.last_name} ({c.therapist.specialty})
                      </div>
                      <div style={{ fontSize: "0.95rem", lineHeight: 1.5, color: "#334155" }}>
                        {c.answer_text}
                      </div>
                      
                      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                        <Link href={`/marketplace/${c.therapist.id}`} style={{ display: "inline-block", padding: "0.5rem 1rem", background: "white", color: "var(--primary)", border: "1px solid var(--primary)", borderRadius: "0.5rem", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>
                          📅 Book a full session with {c.therapist.user.first_name}
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.9rem", color: "var(--muted-foreground)", fontStyle: "italic" }}>
                      {c.status === "pending" ? "Waiting for a therapist to claim this question..." : "A therapist is currently reviewing and typing an answer..."}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
