import os

filepath = "/Users/pstmacbook/Documents/Sanat-Personal/Special Education/frontend/src/app/dashboard/page.tsx"

with open(filepath, "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "const [loading, setLoading] = useState(!cachedPlan);" in line:
        new_lines.append("  const [videos, setVideos] = useState<any[]>([]);\n")
        new_lines.append(line)
    elif "const snapshotRes = await fetch(`${API_URL}/api/v1/onboarding/assessment`" in line:
        # Before we fetch snapshot, fetch videos
        new_lines.append("""
        // Fetch Trending Videos
        try {
          const vidRes = await fetch(`${API_URL}/api/v1/videos`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (vidRes.ok) {
            const data = await vidRes.json();
            setVideos(data.slice(0, 10)); // Top 10 for carousel
          }
        } catch (err) {
          console.error("Could not fetch videos", err);
        }
""")
        new_lines.append(line)
    elif "const { plan: cachedPlan, snapshot: cachedSnapshot, setPlan, setSnapshot } = useAppStore();" in line:
        new_lines.append(line)
    elif "{/* Developmental Milestones Card */}" in line:
        # Insert video carousel right above Developmental Milestones
        new_lines.append("""
        {/* Trending Therapy Videos Carousel */}
        {videos.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Trending Therapy Videos</h2>
              <Link href="/dashboard/feed" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>View All →</Link>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              overflowX: 'auto', 
              paddingBottom: '1rem',
              scrollbarWidth: 'none', // Firefox
              WebkitOverflowScrolling: 'touch' 
            }}
            className="hide-scrollbar"
            >
              {videos.map((vid: any, i: number) => (
                <Link key={vid.id} href={`/dashboard/feed`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    minWidth: '220px',
                    width: '220px',
                    height: '320px',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    position: 'relative',
                    background: `linear-gradient(135deg, hsl(${i * 45}, 80%, 70%), hsl(${i * 45 + 30}, 80%, 50%))`,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '1rem',
                    color: 'white'
                  }}>
                    {/* Play Button Overlay */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.3)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    
                    <div style={{ position: 'relative', zIndex: 10, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)', margin: '-1rem', padding: '2rem 1rem 1rem 1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{vid.title}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.5rem' }}>{vid.therapist?.full_name || 'Therapist'}</div>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        <span>👁️ {vid.views_count || 0}</span>
                        <span>❤️ {vid.likes_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
""")
        new_lines.append(line)
    else:
        new_lines.append(line)

with open(filepath, "w") as f:
    f.writelines(new_lines)
print("Added videos carousel to dashboard.")
