"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { DailyProvider, useLocalSessionId, useParticipantIds, useVideoTrack, useAudioTrack, DailyVideo, useDaily } from "@daily-co/daily-react";

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
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#111" }}>
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
          <button onClick={leaveCall} style={{ padding: "0.75rem 1.5rem", background: "#ef4444", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer" }}>
            End Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#111" }}>
      <div style={{ flex: 1, position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", padding: "1rem", gap: "1rem" }}>
        <RemoteParticipants />
        <LocalParticipant />
      </div>
      
      {/* Controls */}
      <div style={{ padding: "1rem", background: "#000", display: "flex", justifyContent: "center", gap: "1rem" }}>
        <button onClick={leaveCall} style={{ padding: "0.75rem 1.5rem", background: "#ef4444", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer" }}>
          End Session
        </button>
      </div>
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
