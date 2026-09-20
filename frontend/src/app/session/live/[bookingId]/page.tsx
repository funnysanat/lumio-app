"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { DailyProvider, useLocalSessionId, useParticipantIds, useVideoTrack, useAudioTrack, DailyVideo, useDaily, useAppMessage, useParticipantProperty } from "@daily-co/daily-react";

export default function LiveSessionWrapper() {
  const { bookingId } = useParams();
  const { getToken } = useAuth();
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = await getToken();
        
        // Try fetching from parent route first
        let res = await fetch(`${API_URL}/api/v1/marketplace/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let bookings = [];
        if (res.ok) {
          bookings = await res.json();
        }
        
        let b = bookings.find((bk: any) => bk.id === bookingId);
        
        // If not found in parent bookings, try therapist bookings
        if (!b) {
          res = await fetch(`${API_URL}/api/v1/therapist/bookings`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            bookings = await res.json();
            b = bookings.find((bk: any) => bk.id === bookingId);
          }
        }
        
        if (b) {
          if (b.status !== "confirmed") {
            setError("This session is not confirmed.");
          } else if (!b.video_room_url) {
            setError("Video room not generated. The room is generated when the therapist confirms an online booking.");
          } else {
            setRoomUrl(b.video_room_url);
          }
        } else {
          setError("Booking not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Error connecting to server.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (!roomUrl) return;
    
    const newCallObject = DailyIframe.createCallObject({
      videoSource: true,
      audioSource: true,
    });
    
    setCallObject(newCallObject);
    
    return () => {
      newCallObject.destroy();
    };
  }, [roomUrl]);

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyItems: "center", padding: "3rem" }}>Loading session...</div>;
  if (error) return <div style={{ minHeight: "100vh", padding: "3rem", color: "red" }}>{error}</div>;
  if (!callObject || !roomUrl) return <div style={{ minHeight: "100vh", padding: "3rem" }}>Initializing camera...</div>;

  return (
    <DailyProvider callObject={callObject}>
      <LiveSessionUI roomUrl={roomUrl} />
    </DailyProvider>
  );
}

function LiveSessionUI({ roomUrl }: { roomUrl: string }) {
  const callObject = useDaily();
  const [joined, setJoined] = useState(false);
  const [isMockFallback, setIsMockFallback] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const router = useRouter();

  const joinCall = useCallback(async () => {
    if (!callObject) return;
    try {
      await callObject.join({ url: roomUrl });
      setJoined(true);
    } catch (err) {
      console.error("Failed to join Daily call:", err);
      if (roomUrl.includes("mock-room")) {
        // Fallback to local camera only for demo purposes
        setIsMockFallback(true);
        setJoined(true);
      } else {
        alert("Failed to join the video session. Please check your connection.");
      }
    }
  }, [callObject, roomUrl]);

  const leaveCall = useCallback(async () => {
    if (callObject && !isMockFallback) {
      await callObject.leave();
    }
    setJoined(false);
    router.push("/dashboard");
  }, [callObject, router, isMockFallback]);

  if (!joined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--background)", color: "var(--foreground)" }}>
        <h1 style={{ marginBottom: "2rem" }}>Ready to join the session?</h1>
        <button onClick={joinCall} style={{ padding: "1rem 2rem", background: "var(--primary)", color: "white", borderRadius: "1rem", border: "none", cursor: "pointer", fontSize: "1.2rem", fontWeight: 700 }}>
          Join Video Session
        </button>
      </div>
    );
  }

  if (isMockFallback) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "#111" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", textAlign: "center", fontSize: "0.85rem" }}>
            <strong>Demo Mode:</strong> You are viewing a simulated session because no DAILY_API_KEY is configured on the backend.
          </div>
          <div style={{ flex: 1, position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", padding: "1rem", gap: "1rem" }}>
            <div style={{ flex: 1, minWidth: "320px", height: "100%", maxHeight: "calc(100vh - 100px)", background: "#222", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>
              Waiting for others to join...
            </div>
            <HTML5LocalVideo />
          </div>
          
          {/* Controls */}
          <div style={{ padding: "1rem", background: "#000", display: "flex", justifyContent: "center", gap: "1rem" }}>
            <button onClick={() => setChatOpen(!chatOpen)} style={{ padding: "0.75rem 1.5rem", background: "#333", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer" }}>
              {chatOpen ? "Hide Chat" : "Show Chat"}
            </button>
            <button onClick={leaveCall} style={{ padding: "0.75rem 1.5rem", background: "#ef4444", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer" }}>
              End Session
            </button>
          </div>
        </div>
        {chatOpen && <ChatSidebar onClose={() => setChatOpen(false)} />}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#111" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", padding: "1rem", gap: "1rem" }}>
          <RemoteParticipants />
          <LocalParticipant />
        </div>
        
        {/* Controls */}
        <div style={{ padding: "1rem", background: "#000", display: "flex", justifyContent: "center", gap: "1rem" }}>
          <button onClick={() => setChatOpen(!chatOpen)} style={{ padding: "0.75rem 1.5rem", background: "#333", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer" }}>
            {chatOpen ? "Hide Chat" : "Show Chat"}
          </button>
          <button onClick={leaveCall} style={{ padding: "0.75rem 1.5rem", background: "#ef4444", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer" }}>
            End Session
          </button>
        </div>
      </div>
      {chatOpen && <ChatSidebar onClose={() => setChatOpen(false)} />}
    </div>
  );
}

function ChatSidebar({ onClose }: { onClose: () => void }) {
  const localSessionId = useLocalSessionId();
  const localUserName = useParticipantProperty(localSessionId || "", "user_name") || "You";
  
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const sendAppMessage = useAppMessage({
    onAppMessage: (ev) => {
      setMessages((prev) => [...prev, { ...ev.data, fromId: ev.fromId, timestamp: Date.now() }]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    const msg = { type: 'text', content: text, senderName: localUserName };
    sendAppMessage(msg);
    setMessages(prev => [...prev, { ...msg, fromId: 'local', timestamp: Date.now() }]);
    setText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`${API_URL}/api/v1/session/upload-chat-file`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      const msg = { type: 'file', content: data.url, fileName: data.filename, senderName: localUserName };
      sendAppMessage(msg);
      setMessages(prev => [...prev, { ...msg, fromId: 'local', timestamp: Date.now() }]);
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div style={{ width: "320px", background: "#1a1a1a", display: "flex", flexDirection: "column", borderLeft: "1px solid #333" }}>
      <div style={{ padding: "1rem", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, color: "white", fontSize: "1.1rem" }}>Session Chat</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
      </div>
      
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {messages.length === 0 ? (
          <div style={{ color: "#666", textAlign: "center", marginTop: "2rem", fontSize: "0.9rem" }}>No messages yet. Say hi!</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.fromId === 'local' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div style={{ fontSize: "0.7rem", color: "#666", marginBottom: "0.25rem", textAlign: m.fromId === 'local' ? 'right' : 'left' }}>
                {m.fromId === 'local' ? 'You' : m.senderName || 'Participant'}
              </div>
              <div style={{ background: m.fromId === 'local' ? 'var(--primary)' : '#333', color: 'white', padding: "0.5rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.9rem" }}>
                {m.type === 'text' ? (
                  m.content
                ) : (
                  <a href={m.content} target="_blank" rel="noopener noreferrer" style={{ color: "white", textDecoration: "underline", display: "flex", alignItems: "center", gap: "0.5rem", wordBreak: 'break-all' }}>
                    📎 {m.fileName || 'Shared Document'}
                  </a>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendText} style={{ padding: "1rem", borderTop: "1px solid #333", display: "flex", gap: "0.5rem" }}>
        <div style={{ position: "relative" }}>
          <input type="file" id="file-upload" style={{ display: "none" }} onChange={handleFileUpload} disabled={uploading} />
          <label htmlFor="file-upload" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", background: "#333", borderRadius: "0.25rem", cursor: "pointer", color: "#ccc" }}>
            {uploading ? "⏳" : "📎"}
          </label>
        </div>
        <input 
          type="text" 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="Type a message..." 
          style={{ flex: 1, padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid #444", background: "#222", color: "white", outline: "none", minWidth: 0 }}
        />
        <button type="submit" disabled={!text.trim()} style={{ padding: "0 1rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "0.25rem", cursor: text.trim() ? "pointer" : "not-allowed" }}>
          Send
        </button>
      </form>
    </div>
  );
}

function HTML5LocalVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Could not access camera", err));
    }
  }, []);

  return (
    <div style={{ width: "240px", height: "160px", background: "#222", borderRadius: "0.5rem", overflow: "hidden", position: "relative" }}>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
      <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.6)", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem" }}>
        You (Simulated)
      </div>
    </div>
  );
}

function LocalParticipant() {
  const localSessionId = useLocalSessionId();
  const videoState = useVideoTrack(localSessionId);
  
  if (!localSessionId) return null;
  
  return (
    <div style={{ width: "240px", height: "160px", background: "#222", borderRadius: "0.5rem", overflow: "hidden", position: "relative" }}>
      <DailyVideo sessionId={localSessionId} mirror style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.6)", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem" }}>
        You
      </div>
    </div>
  );
}

function RemoteParticipants() {
  const remoteParticipantIds = useParticipantIds({ filter: "remote" });
  
  if (remoteParticipantIds.length === 0) {
    return <div style={{ color: "#fff", flex: 1, textAlign: "center" }}>Waiting for others to join...</div>;
  }
  
  return (
    <>
      {remoteParticipantIds.map(id => (
        <div key={id} style={{ flex: 1, minWidth: "320px", height: "100%", maxHeight: "calc(100vh - 100px)", background: "#222", borderRadius: "0.5rem", overflow: "hidden", position: "relative" }}>
          <DailyVideo sessionId={id} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      ))}
    </>
  );
}
