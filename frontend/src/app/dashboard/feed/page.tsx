"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Video = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  therapist: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
};

export default function FeedPage() {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    const fetchVideos = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/v1/videos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setVideos(data);
        }
      } catch (e) {
        console.error("Failed to fetch feed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [userId, getToken, API_URL, router]);

  const handleLike = async (id: string) => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/v1/videos/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(prev => prev.map(v => v.id === id ? { ...v, likes_count: v.likes_count + 1 } : v));
    } catch(e) {}
  };

  const handlePlay = async (id: string) => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/v1/videos/${id}/view`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      // We don't eagerly update UI view count to avoid flicker, or we can.
    } catch(e) {}
  };

  if (loading) return <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted-foreground)" }}>Loading Therapy Videos...</div>;

  return (
    <div>
      <header className="header">
        <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="14" width="8" height="8" rx="2.5" fill="#38bdf8" />
            <rect x="13" y="14" width="8" height="8" rx="2.5" fill="#a78bfa" />
            <rect x="8" y="5" width="8" height="8" rx="2.5" fill="#f472b6" />
          </svg>
          Lumio AI
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Dashboard</Link>
          <Link href="/marketplace" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Find Therapists</Link>
        </div>
      </header>

      <main className="page-wrapper container-lg animate-fade-in" style={{ maxWidth: '600px' }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.75rem", fontWeight: 800 }}>Therapy Video Feed</h1>
        <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem" }}>
          Discover tips, exercises, and insights from verified therapists.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {videos.length === 0 ? (
            <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>
              No videos available right now.
            </div>
          ) : (
            videos.map(v => (
              <div key={v.id} className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--muted)", overflow: "hidden" }}>
                    {v.therapist.profile_photo_url ? (
                      <img src={v.therapist.profile_photo_url} alt={v.therapist.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🩺</div>
                    )}
                  </div>
                  <div>
                    <Link href={`/marketplace/therapist/${v.therapist.id}`} style={{ fontWeight: 700, color: "var(--foreground)", textDecoration: "none" }}>
                      {v.therapist.full_name}
                    </Link>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                      {new Date(v.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ background: "#000", position: "relative", width: "100%", maxHeight: "500px", display: "flex", justifyContent: "center" }}>
                  <video 
                    src={v.video_url} 
                    controls 
                    style={{ maxHeight: "500px", maxWidth: "100%", objectFit: "contain" }} 
                    onPlay={() => handlePlay(v.id)}
                  />
                </div>

                <div style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button onClick={() => handleLike(v.id)} style={{ background: "none", border: "none", color: "var(--foreground)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "1rem" }}>
                        ❤️ {v.likes_count}
                      </button>
                      <button style={{ background: "none", border: "none", color: "var(--foreground)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "1rem" }}>
                        💬 {v.comments_count}
                      </button>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
                      👁️ {v.views_count} views
                    </div>
                  </div>
                  
                  <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem" }}>{v.title}</h3>
                  {v.description && (
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                      {v.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
