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
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const formData = new FormData();
      if (notes) formData.append("notes", notes);
      if (audioBlob) {
        formData.append("audio", audioBlob, "summary.webm");
      }

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
          Provide notes and an optional audio summary for the parents. This helps the AI engine adjust the child's developmental plan.
        </p>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: "0.4rem" }}>Text Notes</label>
          <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Key observations, engagement level, home recommendations..."
            style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: "0.4rem" }}>Audio Summary (Optional)</label>
          {!audioBlob && !isRecording && (
            <button onClick={startRecording} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontWeight: 600 }}>
              🎤 Start Recording
            </button>
          )}
          {isRecording && (
            <button onClick={stopRecording} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white", animation: "pulse 1.5s infinite" }} /> Stop Recording
            </button>
          )}
          {audioBlob && !isRecording && (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <audio controls src={URL.createObjectURL(audioBlob)} style={{ height: "36px", flex: 1 }} />
              <button onClick={() => setAudioBlob(null)} style={{ padding: "0.4rem 0.8rem", borderRadius: "0.5rem", background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", cursor: "pointer", fontSize: "0.8rem" }}>
                Discard
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "2rem" }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.75rem", background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 700 }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting || (!notes && !audioBlob)} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.75rem", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>
            {isSubmitting ? "Saving..." : "Save & Complete"}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
