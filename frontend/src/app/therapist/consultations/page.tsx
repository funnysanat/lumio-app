"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

type Consultation = {
  id: string;
  parent_id: string;
  question_text: string;
  status: string;
  price_inr: number;
  answer_text: string | null;
  created_at: string;
};

export default function ConsultationBoardPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"available" | "mine">("available");
  
  const [availableQuestions, setAvailableQuestions] = useState<Consultation[]>([]);
  const [myQuestions, setMyQuestions] = useState<Consultation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchBoard = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/consultations/board`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAvailableQuestions(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyTasks = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/consultations/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMyQuestions(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchBoard(), fetchMyTasks()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // In a real app, we'd poll or use websockets for the board
    const interval = setInterval(fetchBoard, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = async (id: string) => {
    setClaimingId(id);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/consultations/${id}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert("Question claimed successfully!");
        setActiveTab("mine");
        loadData();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to claim question.");
        fetchBoard(); // Refresh board as someone else likely claimed it
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaimingId(null);
    }
  };

  const handleSubmitAnswer = async (id: string) => {
    const answer = answerInputs[id];
    if (!answer?.trim()) return;

    setSubmittingId(id);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/consultations/${id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answer_text: answer })
      });
      
      if (res.ok) {
        alert("Answer submitted! You've earned ₹199.");
        loadData();
      } else {
        alert("Failed to submit answer.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "4rem" }}>
      <header style={{ background: "var(--card-bg)", padding: "1.5rem 0", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10 }}>
        <div className="container-lg" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Link href="/therapist/dashboard" style={{ textDecoration: "none", color: "var(--primary)", fontWeight: 600, display: "inline-block", marginBottom: "0.5rem" }}>
              ← Back to Dashboard
            </Link>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Consultation Board</h1>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button 
              onClick={() => setActiveTab("available")}
              style={{ padding: "0.5rem 1rem", borderRadius: "2rem", border: "none", fontWeight: 600, cursor: "pointer", background: activeTab === "available" ? "var(--primary)" : "transparent", color: activeTab === "available" ? "white" : "var(--foreground)" }}
            >
              Available Questions ({availableQuestions.length})
            </button>
            <button 
              onClick={() => setActiveTab("mine")}
              style={{ padding: "0.5rem 1rem", borderRadius: "2rem", border: "none", fontWeight: 600, cursor: "pointer", background: activeTab === "mine" ? "var(--primary)" : "transparent", color: activeTab === "mine" ? "white" : "var(--foreground)" }}
            >
              My Tasks ({myQuestions.filter(q => q.status === 'claimed').length})
            </button>
          </div>
        </div>
      </header>

      <main className="container-lg" style={{ marginTop: "2rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>Loading board...</div>
        ) : activeTab === "available" ? (
          <div>
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 1.5rem 0" }}>Questions waiting for answers</h2>
            {availableQuestions.length === 0 ? (
              <div className="card" style={{ textAlign: "center", color: "var(--muted-foreground)" }}>
                No pending questions right now. Take a break!
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
                {availableQuestions.map(q => (
                  <div key={q.id} className="card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
                        Asked {new Date(q.created_at).toLocaleTimeString()}
                      </span>
                      <span style={{ fontWeight: 700, color: "#16a34a" }}>Earn ₹175</span>
                    </div>
                    <div style={{ fontWeight: 500, fontSize: "1.05rem", lineHeight: 1.5, marginBottom: "1.5rem", flex: 1 }}>
                      "{q.question_text}"
                    </div>
                    <button 
                      onClick={() => handleClaim(q.id)}
                      disabled={claimingId === q.id}
                      style={{ width: "100%", padding: "0.75rem", background: "#111", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: claimingId === q.id ? "not-allowed" : "pointer" }}
                    >
                      {claimingId === q.id ? "Claiming..." : "Claim Question"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", margin: "0 0 1.5rem 0" }}>To Do</h2>
              {myQuestions.filter(q => q.status === "claimed").length === 0 ? (
                <div style={{ color: "var(--muted-foreground)" }}>No pending tasks. Claim a question from the board!</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {myQuestions.filter(q => q.status === "claimed").map(q => (
                    <div key={q.id} className="card" style={{ borderLeft: "4px solid var(--primary)" }}>
                      <div style={{ fontWeight: 500, fontSize: "1.1rem", marginBottom: "1rem" }}>
                        Q: {q.question_text}
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: "1rem" }}>
                        <textarea
                          className="form-input"
                          rows={6}
                          placeholder="Type your professional advice here..."
                          value={answerInputs[q.id] || ""}
                          onChange={e => setAnswerInputs({...answerInputs, [q.id]: e.target.value})}
                        />
                      </div>
                      <button 
                        onClick={() => handleSubmitAnswer(q.id)}
                        disabled={submittingId === q.id || !answerInputs[q.id]?.trim()}
                        style={{ padding: "0.75rem 1.5rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: (submittingId === q.id || !answerInputs[q.id]?.trim()) ? "not-allowed" : "pointer" }}
                      >
                        {submittingId === q.id ? "Submitting..." : "Submit Answer & Earn ₹175"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 style={{ fontSize: "1.25rem", margin: "2rem 0 1.5rem 0", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>History (Completed)</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {myQuestions.filter(q => q.status === "answered").map(q => (
                  <div key={q.id} className="card" style={{ padding: "1rem 1.5rem", background: "#f8fafc" }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 500, marginBottom: "0.5rem", color: "#475569" }}>
                      Q: {q.question_text}
                    </div>
                    <div style={{ fontSize: "0.95rem", color: "#0f172a" }}>
                      <strong>Your Answer:</strong> {q.answer_text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
