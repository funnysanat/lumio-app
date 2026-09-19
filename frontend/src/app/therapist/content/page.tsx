"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

type Video = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  is_verified: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
};

export default function TherapistContentHub() {
  const { getToken } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchVideos = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/therapist/videos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (e) {
      console.error("Failed to fetch videos", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [getToken, API_URL]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || !uploadTitle) return;

    setIsUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("title", uploadTitle);
      if (uploadDesc) formData.append("description", uploadDesc);
      formData.append("video", file);

      const res = await fetch(`${API_URL}/api/v1/therapist/videos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setUploadTitle("");
        setUploadDesc("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        await fetchVideos();
        alert("Video uploaded! It is currently pending AI verification.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload video.");
    } finally {
      setIsUploading(false);
    }
  };

  const totalViews = videos.reduce((acc, v) => acc + v.views_count, 0);
  const totalLikes = videos.reduce((acc, v) => acc + v.likes_count, 0);

  if (loading) return <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted-foreground)" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "4rem" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--card)", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="14" width="8" height="8" rx="2.5" fill="#38bdf8" />
            <rect x="13" y="14" width="8" height="8" rx="2.5" fill="#a78bfa" />
            <rect x="8" y="5" width="8" height="8" rx="2.5" fill="#f472b6" />
          </svg>
          <span style={{ fontWeight: 700, color: "var(--foreground)" }}>Lumio AI</span>
          <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>/ Content Hub</span>
        </Link>
        <Link href="/therapist/dashboard" style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
          Back to Dashboard
        </Link>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "2rem", alignItems: "start" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: "1.75rem" }}>Your Video Library</h1>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{videos.length}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>Total Videos</div>
              </div>
              <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{totalViews}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>Total Views</div>
              </div>
              <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{totalLikes}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>Total Likes</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
              {videos.length === 0 && (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted-foreground)", gridColumn: "1 / -1" }}>
                  You haven't uploaded any videos yet.
                </div>
              )}
              {videos.map(v => (
                <div key={v.id} className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ background: "#000", position: "relative", paddingTop: "56.25%" }}>
                    <video src={v.video_url} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} controls />
                  </div>
                  <div style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{v.title}</h3>
                      {v.is_verified ? (
                        <span style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "0.1rem 0.4rem", borderRadius: "1rem", fontSize: "0.7rem", fontWeight: 700 }}>Verified</span>
                      ) : (
                        <span style={{ background: "rgba(234,179,8,0.1)", color: "#eab308", padding: "0.1rem 0.4rem", borderRadius: "1rem", fontSize: "0.7rem", fontWeight: 700 }}>Pending</span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", display: "flex", gap: "1rem" }}>
                      <span>👁️ {v.views_count}</span>
                      <span>❤️ {v.likes_count}</span>
                      <span>💬 {v.comments_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: "1.5rem", position: "sticky", top: "2rem" }}>
            <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem", fontWeight: 700 }}>Upload New Video</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
              Share educational content, therapy tips, or exercises to boost your visibility on the marketplace. Videos are verified by AI before being published to parents.
            </p>
            
            <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Title</label>
                <input 
                  type="text" 
                  required
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", padding: "0.75rem", borderRadius: "0.5rem", color: "white" }}
                  placeholder="e.g., Speech Therapy Tip 1"
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Description (Optional)</label>
                <textarea 
                  value={uploadDesc}
                  onChange={e => setUploadDesc(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", padding: "0.75rem", borderRadius: "0.5rem", color: "white", minHeight: "80px", resize: "vertical" }}
                  placeholder="Briefly describe the video..."
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Video File</label>
                <input 
                  type="file" 
                  required
                  accept="video/*"
                  ref={fileInputRef}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", padding: "0.75rem", borderRadius: "0.5rem", color: "white" }}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isUploading}
                style={{ 
                  marginTop: "0.5rem", padding: "0.75rem", borderRadius: "0.5rem", border: "none",
                  background: isUploading ? "var(--muted)" : "#ec4899", 
                  color: "white", fontWeight: 700, cursor: isUploading ? "not-allowed" : "pointer",
                  transition: "background 0.2s"
                }}
              >
                {isUploading ? "Uploading..." : "Upload & Verify"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
