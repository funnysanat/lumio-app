import re

with open("src/app/session/[activityId]/page.tsx", "r") as f:
    content = f.read()

# 1. Imports
content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';\nimport { QRCodeSVG } from 'qrcode.react';")

# 2. State setup
state_setup = """  const searchParams = useSearchParams();
  const role = searchParams.get('role'); // 'parent', 'child', or null

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [engagementMode, setEngagementMode] = useState<'game' | 'music'>('game');
  const [showQR, setShowQR] = useState(false);

  // WebSocket Connection
  useEffect(() => {
    if (!role) return;
    const wsUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('http', 'ws') 
      : 'ws://localhost:8000';
    const socket = new WebSocket(`${wsUrl}/api/v1/ws/session/${activityId}`);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'STATE_CHANGE') setSessionState(data.payload);
        else if (data.type === 'ENGAGEMENT_MODE') setEngagementMode(data.payload);
      } catch (e) {}
    };
    setWs(socket);
    return () => socket.close();
  }, [activityId, role]);

  const updateSessionState = (newState: 'prep' | 'active' | 'logging') => {
    setSessionState(newState);
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'STATE_CHANGE', payload: newState }));
  };
  const updateEngagementMode = (mode: 'game' | 'music') => {
    setEngagementMode(mode);
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ENGAGEMENT_MODE', payload: mode }));
  };

  const [viewMode, setViewMode]"""
content = content.replace("  const [viewMode, setViewMode]", state_setup)

# 3. Update viewMode logic
view_mode_logic = """  // Handle responsive behavior & roles
  useEffect(() => {
    if (role === 'child') {
      setViewMode('child');
    } else if (role === 'parent') {
      setViewMode('parent');
    } else {
      const handleResize = () => {
        if (window.innerWidth < 768) {
          setViewMode('parent');
        } else {
          setViewMode('split');
        }
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [role]);"""
content = re.sub(r'  // Handle responsive behavior\n.*?  \}, \[\]\);', view_mode_logic, content, flags=re.DOTALL)

# 4. handleResponse and setSessionState
content = content.replace("setSessionState('logging')", "updateSessionState('logging')")
content = content.replace("setSessionState('active')", "updateSessionState('active')")

# 5. Prep screen QR code
prep_qr = """        <div style={{ marginBottom: '2rem' }}>
          <button className="btn btn-outline" onClick={() => setShowQR(!showQR)} style={{ width: '100%' }}>
            📱 Connect Child Device
          </button>
          {showQR && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <QRCodeSVG value={`${window.location.origin}/session/${activityId}?role=child`} size={150} />
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>Scan with iPad or tablet</p>
              <button className="btn btn-outline" onClick={() => router.push(`/session/${activityId}?role=parent`)} style={{ marginTop: '1rem' }}>
                Join as Parent on this device
              </button>
            </div>
          )}
        </div>
        <button className="btn btn-primary\""""
content = content.replace('<button className="btn btn-primary"', prep_qr, 1)

# 6. Engagement mode toggle in Parent view
parent_toggle = """                <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem 0' }}>
                  {(role === 'parent' || viewMode === 'split') && (
                    <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--card-bg)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: 'var(--foreground)' }}>Child Engagement Mode</h4>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button 
                          className={`btn ${engagementMode === 'game' ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => updateEngagementMode('game')}
                        >
                          🎮 Interactive Game
                        </button>
                        <button 
                          className={`btn ${engagementMode === 'music' ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => updateEngagementMode('music')}
                        >
                          🎵 Soothing Music
                        </button>
                      </div>
                    </div>
                  )}
                  <h3 style={{ color: '#166534' }}>Response Logged!</h3>"""
content = content.replace("""                <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <h3 style={{ color: '#166534' }}>Response Logged!</h3>""", parent_toggle)

# 7. Child View rendering
child_view_logic = """        {(viewMode === 'split' || viewMode === 'child') && (
          <div style={{ flex: viewMode === 'split' ? 1 : 'none', width: viewMode === 'child' ? '100%' : 'auto', backgroundColor: engagementMode === 'music' && sessionState === 'logging' ? '#0f172a' : '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transition: 'background-color 1s ease' }}>
            
            {sessionState === 'logging' && engagementMode === 'game' && (
              <InteractiveGame emoji={activity.emoji} />
            )}

            {sessionState === 'logging' && engagementMode === 'music' && (
              <div style={{ position: 'absolute', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <audio autoPlay loop src="/soothing-instrumental.mp3" />
                <div style={{ width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', animation: 'pulse 4s infinite alternate' }} />
              </div>
            )}

            {/* Sensory-friendly child interface */}
            <div style={{ textAlign: 'center', zIndex: 10, pointerEvents: 'none', opacity: engagementMode === 'music' && sessionState === 'logging' ? 0 : 1, transition: 'opacity 1s ease' }}>"""

content = re.sub(r'        \{\(viewMode === \'split\' \|\| viewMode === \'child\'\).*?\{/\* Sensory-friendly child interface \*/\}\n            <div style={{ textAlign: \'center\', zIndex: 10, pointerEvents: \'none\' \}\}>', child_view_logic, content, flags=re.DOTALL)

with open("src/app/session/[activityId]/page.tsx", "w") as f:
    f.write(content)

print("Updated page.tsx")
