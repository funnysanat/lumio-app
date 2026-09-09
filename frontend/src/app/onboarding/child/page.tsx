"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

const KEYSTONE_MILESTONES = [
  // Gross Motor
  { id: "m_gm_0_6", category: "Movement", text: "Can sit up with support" },
  { id: "m_gm_6_12", category: "Movement", text: "Can stand while holding onto furniture" },
  { id: "m_gm_12_18", category: "Movement", text: "Can walk alone without holding on" },
  { id: "m_gm_18_24", category: "Movement", text: "Can run and kick a ball" },
  
  // Fine Motor
  { id: "m_fm_0_6", category: "Hand Skills", text: "Reaches out for toys or objects" },
  { id: "m_fm_6_12", category: "Hand Skills", text: "Can pick up small things with thumb and finger (pincer grasp)" },
  { id: "m_fm_12_18", category: "Hand Skills", text: "Scribbles spontaneously with a crayon" },
  { id: "m_fm_18_24", category: "Hand Skills", text: "Can stack 4 or more blocks" },
  
  // Receptive Language
  { id: "m_rl_0_6", category: "Understanding", text: "Turns their head towards a sound or voice" },
  { id: "m_rl_6_12", category: "Understanding", text: "Understands the word 'no' and points to things they want" },
  { id: "m_rl_12_18", category: "Understanding", text: "Follows simple 1-step instructions (e.g., 'give me the ball')" },
  { id: "m_rl_18_24", category: "Understanding", text: "Can point to 5 different body parts when asked" },
  
  // Expressive Language
  { id: "m_el_0_6", category: "Speaking", text: "Makes babbling sounds (e.g., 'bababa', 'dadada')" },
  { id: "m_el_6_12", category: "Speaking", text: "Says 'mama' or 'dada' to refer to parents" },
  { id: "m_el_12_18", category: "Speaking", text: "Uses 5-10 meaningful words" },
  { id: "m_el_18_24", category: "Speaking", text: "Puts 2 words together (e.g., 'more milk', 'my toy')" },
  
  // Social Skills
  { id: "m_ss_0_6", category: "Social & Play", text: "Smiles at familiar people" },
  { id: "m_ss_6_12", category: "Social & Play", text: "Plays peek-a-boo and waves bye-bye" },
  { id: "m_ss_12_18", category: "Social & Play", text: "Brings toys to show you and imitates what you do" },
  { id: "m_ss_18_24", category: "Social & Play", text: "Plays nicely alongside other children (parallel play)" },
];

export default function ChildProfilePage() {
  const router = useRouter();
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [firstName, setFirstName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [communicationLevel, setCommunicationLevel] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [checkedMilestones, setCheckedMilestones] = useState<string[]>([]);

  const [step, setStep] = useState(1);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = await getToken();
        if (!token) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // Fetch Child Profile
        const res = await fetch(`${API_URL}/api/v1/onboarding/child`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const json = await res.json();
          if (json.child) {
            setFirstName(json.child.first_name || '');
            setDateOfBirth(json.child.date_of_birth || '');
            setCommunicationLevel(json.child.communication_level || '');
            setPreferredLanguage(json.child.preferred_language || 'English');
          }
        }
        
        // Fetch Assessment for checkboxes
        const assessmentRes = await fetch(`${API_URL}/api/v1/onboarding/assessment`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (assessmentRes.ok) {
          const data = await assessmentRes.json();
          if (data.snapshot && data.snapshot.domain_scores) {
            const scores = data.snapshot.domain_scores;
            
            // Prefer exact raw IDs if saved
            if (scores["_checked_ids"] && Array.isArray(scores["_checked_ids"])) {
              setCheckedMilestones(scores["_checked_ids"]);
              return;
            }
            
            // Fallback: Reverse map the bands to checkboxes
            const preChecked: string[] = [];
            
            KEYSTONE_MILESTONES.forEach(m => {
              // Hacky but works for MVP: extract domain prefix (e.g., m_gm) and age (e.g., 18_24)
              // We just check if the milestone ID matches the derived IDs from the score bands
              // But actually we can just check if this milestone was likely checked
              // For a robust MVP, let's just pre-check the specific one that matches the band
              const domainMap: Record<string, string> = {
                "Movement": "GrossMotor",
                "Hand Skills": "FineMotor",
                "Understanding": "ReceptiveLanguage",
                "Speaking": "ExpressiveLanguage",
                "Social & Play": "SocialSkills"
              };
              
              const clinicalDomain = domainMap[m.category];
              const achievedBand = scores[clinicalDomain];
              
              if (achievedBand) {
                // E.g., band is "12-18 months"
                const bandSlug = achievedBand.split(' ')[0].replace('-', '_'); // "12_18"
                if (m.id.includes(bandSlug)) {
                  preChecked.push(m.id);
                }
                // We also check earlier ones
                if (achievedBand === "18-24 months" && (m.id.includes("12_18") || m.id.includes("6_12") || m.id.includes("0_6"))) preChecked.push(m.id);
                if (achievedBand === "12-18 months" && (m.id.includes("6_12") || m.id.includes("0_6"))) preChecked.push(m.id);
                if (achievedBand === "6-12 months" && m.id.includes("0_6")) preChecked.push(m.id);
              }
            });
            
            setCheckedMilestones(preChecked);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setFetching(false);
      }
    }
    fetchProfile();
  }, [getToken]);


  const toggleMilestone = (id: string) => {
    if (checkedMilestones.includes(id)) {
      setCheckedMilestones(checkedMilestones.filter(m => m !== id));
    } else {
      setCheckedMilestones([...checkedMilestones, id]);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const data = {
      first_name: firstName,
      date_of_birth: dateOfBirth, // YYYY-MM
      communication_level: communicationLevel,
      preferred_language: preferredLanguage,
      checked_milestone_ids: checkedMilestones
    };

    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/v1/onboarding/child`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        router.push('/onboarding/goals');
      } else {
        alert('Failed to save profile');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  }

  // Group milestones by category
  const categories = Array.from(new Set(KEYSTONE_MILESTONES.map(m => m.category)));

  if (fetching) {
    return <div style={{ paddingTop: '100px', textAlign: 'center', color: '#a1a1aa' }}>Loading profile...</div>;
  }

  return (
    <div>
      <header className="header">
        <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="14" width="8" height="8" rx="2.5" fill="#38bdf8" />
            <rect x="13" y="14" width="8" height="8" rx="2.5" fill="#a78bfa" />
            <rect x="8" y="5" width="8" height="8" rx="2.5" fill="#f472b6" />
          </svg>
          Lumio AI
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Dashboard</Link>
          <UserButton />
        </div>
      </header>

      <div className="page-wrapper container-md animate-fade-in">
      <div className="card">
        {step === 1 && (
          <>
            <h1 style={{ marginBottom: '0.5rem' }}>Let's get to know your child</h1>
            <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>We'll personalise activities just for them.</p>

            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div className="form-group">
                <label className="form-label">Child's First Name</label>
                <input type="text" className="form-input" placeholder="e.g. Arjun" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Birth Date</label>
                <input type="date" className="form-input" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required />
                <span style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.25rem', display: 'block' }}>This helps us track developmental age.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Current Communication</label>
                <select className="form-select" value={communicationLevel} onChange={e => setCommunicationLevel(e.target.value)} required>
                  <option value="">Select level...</option>
                  <option value="sentences">Speaks in sentences</option>
                  <option value="words">Uses single words/phrases</option>
                  <option value="non_speaking">Non-speaking or minimal</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Preferred App Language</label>
                <select className="form-select" value={preferredLanguage} onChange={e => setPreferredLanguage(e.target.value)} required>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Arabic">Arabic (العربية)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary">
                  Next Step: Milestones
                </button>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{ marginBottom: '0.5rem' }}>What can {firstName || 'they'} do right now?</h1>
            <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>Check off the things your child can consistently do. This helps us tailor the exact right activities to close any gaps.</p>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {categories.map(category => (
                  <div key={category}>
                    <h3 style={{ borderBottom: '1px solid #27272a', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{category}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {KEYSTONE_MILESTONES.filter(m => m.category === category).map(m => (
                        <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', backgroundColor: checkedMilestones.includes(m.id) ? 'rgba(167, 139, 250, 0.1)' : 'transparent', borderRadius: '0.25rem' }}>
                          <input 
                            type="checkbox" 
                            checked={checkedMilestones.includes(m.id)}
                            onChange={() => toggleMilestone(m.id)}
                            style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)' }}
                          />
                          <span style={{ color: checkedMilestones.includes(m.id) ? 'var(--primary)' : 'var(--foreground)' }}>{m.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Finish Profile'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
