"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function VideoDetailsPage() {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const videoId = params.videoId as string;
  
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    const fetchVideo = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/v1/videos/${videoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setVideo(data);
          
          // Also record a view
          fetch(`${API_URL}/api/v1/videos/${videoId}/view`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (e) {
        console.error("Failed to fetch video", e);
      } finally {
        setLoading(false);
      }
    };
    
    if (videoId) fetchVideo();
  }, [userId, getToken, API_URL, router, videoId]);

  if (loading) return <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted-foreground)" }}>Loading Video...</div>;
  if (!video) return <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted-foreground)" }}>Video not found.</div>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", paddingBottom: "4rem" }}>
      <header className="header">
        <Link href="/dashboard" style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: 600 }}>
          ← Back to Dashboard
        </Link>
      </header>

      <main className="container-lg" style={{ paddingTop: '100px', maxWidth: '800px' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Video Player Placeholder */}
          <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#0f172a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>▶️</div>
              <div>{video.video_url || 'Video Player'}</div>
            </div>
          </div>
          
          <div style={{ padding: '2rem' }}>
            <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{video.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--muted-foreground)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <span>👁️ {video.views_count} views</span>
              <span>❤️ {video.likes_count} likes</span>
              <span className="badge">{video.category || 'Therapy'}</span>
            </div>
            
            <p style={{ lineHeight: 1.6, fontSize: '1.1rem', color: 'var(--foreground)' }}>
              {video.description}
            </p>
            
            <hr style={{ margin: '2rem 0', borderColor: 'var(--border)', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                {video.therapist?.profile_photo_url ? (
                  <img src={video.therapist.profile_photo_url} alt={video.therapist.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👩‍⚕️</div>
                )}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{video.therapist?.full_name}</h3>
                <Link href={`/marketplace/${video.therapist?.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
                  View Profile & Book Session
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
