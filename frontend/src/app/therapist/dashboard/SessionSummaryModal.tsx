"use client";

import { useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

export default function SessionSummaryModal({ 
  bookingId, 
  onClose,
  onSuccess
}: { 
  bookingId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { getToken } = useAuth();
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const formData = new FormData();
      if (notes) formData.append("notes", notes);

      const res = await fetch(`${API_URL}/api/v1/therapist/bookings/${bookingId}/summary`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to submit summary");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div className="card" style={{ padding: "2rem", width: "100%", maxWidth: "500px", background: "var(--background)", borderRadius: "1rem" }}>
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem" }}>Post-Session Summary</h2>
        <p style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Provide notes for the parents. This helps the AI engine adjust the child's developmental plan in the future.
        </p>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: "0.4rem" }}>Text Notes</label>
          <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Key observations, engagement level, home recommendations..."
            style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "2rem" }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.75rem", background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 700 }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting || !notes} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.75rem", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>
            {isSubmitting ? "Saving..." : "Save & Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
