"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

const INTEREST_OPTIONS = [
  { maxAge: 12, label: "Sensory toys (rattles, crinkle)" },
  { maxAge: 12, label: "Mirrors and faces" },
  { maxAge: 12, label: "Music and singing" },
  { maxAge: 12, label: "Lights and high-contrast patterns" },
  
  { maxAge: 24, label: "Water play / Bubbles" },
  { maxAge: 24, label: "Push and pull toys" },
  { maxAge: 24, label: "Blocks and stacking" },
  { maxAge: 24, label: "Animal sounds and figures" },
  
  { maxAge: 48, label: "Trains, cars, and vehicles" },
  { maxAge: 48, label: "Dinosaurs" },
  { maxAge: 48, label: "Play-Doh / Clay" },
  { maxAge: 48, label: "Pretend play (kitchen, tools)" },
  
  { maxAge: 999, label: "Legos / Building sets" },
  { maxAge: 999, label: "Superheroes / Characters" },
  { maxAge: 999, label: "Puzzles and board games" },
  { maxAge: 999, label: "Space / Science" },
];

export default function InterestsPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [devAgeMonths, setDevAgeMonths] = useState(24); // default
  const [checkedInterests, setCheckedInterests] = useState<string[]>([]);
  const [rewardType, setRewardType] = useState('');

  useEffect(() => {
    async function fetchAge() {
      try {
        const token = await getToken();
        if (!token) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        let ageInMonths = 24; // default
        
        // Try to get developmental snapshot first
        const assessmentRes = await fetch(`${API_URL}/api/v1/onboarding/assessment`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (assessmentRes.ok) {
          const data = await assessmentRes.json();
          if (data.snapshot && data.snapshot.domain_scores) {
            // Find highest band to determine play age
            const bands = Object.values(data.snapshot.domain_scores) as string[];
            let maxMonths = 0;
            for (const b of bands) {
              if (typeof b === 'string') {
                const match = b.match(/(\d+)-(\d+) months/);
                if (match && parseInt(match[2]) > maxMonths) {
                  maxMonths = parseInt(match[2]);
                }
              }
            }
            if (maxMonths > 0) ageInMonths = maxMonths;
          } else if (data.snapshot?.chronological_age_months) {
            ageInMonths = data.snapshot.chronological_age_months;
          }
        }
        
        setDevAgeMonths(ageInMonths);
      } catch (err) {
        console.error("Failed to fetch assessment", err);
      } finally {
        setFetching(false);
      }
    }
    fetchAge();
  }, [getToken]);

  const toggleInterest = (label: string) => {
    if (checkedInterests.includes(label)) {
      setCheckedInterests(checkedInterests.filter(i => i !== label));
    } else {
      setCheckedInterests([...checkedInterests, label]);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const data = {
      interests: checkedInterests.join(", "),
      reward_type: rewardType,
    };

    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/v1/onboarding/interests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        // Triggered the agent in the backend, now go to dashboard
        router.push('/dashboard');
      } else {
        alert('Failed to save interests');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  }

  // Filter interests appropriate for this child's developmental age
  // Show interests up to their age + one band higher for scaffolding
  const suggestedInterests = INTEREST_OPTIONS.filter(opt => {
    if (devAgeMonths <= 12) return opt.maxAge <= 24;
    if (devAgeMonths <= 24) return opt.maxAge <= 48;
    return true;
  });

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

      <div className="page-wrapper container-sm animate-fade-in">
      <div className="card">
        <h1 style={{ marginBottom: '0.5rem' }}>Interests & Rewards</h1>
        <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>We'll use these to theme activities and suggest rewards.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '1rem' }}>What are their current favourite interests?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {suggestedInterests.map(opt => (
                <label key={opt.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', backgroundColor: checkedInterests.includes(opt.label) ? 'rgba(167, 139, 250, 0.1)' : 'transparent', borderRadius: '0.25rem', border: checkedInterests.includes(opt.label) ? '1px solid var(--primary)' : '1px solid var(--border)' }}>
                  <input 
                    type="checkbox" 
                    checked={checkedInterests.includes(opt.label)}
                    onChange={() => toggleInterest(opt.label)}
                    style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: checkedInterests.includes(opt.label) ? 'var(--primary)' : 'var(--foreground)' }}>{opt.label}</span>
                </label>
              ))}
            </div>
            {checkedInterests.length === 0 && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem', display: 'block' }}>Please select at least one interest.</span>}
          </div>

          <div className="form-group" style={{ marginTop: '2rem' }}>
            <label className="form-label">What is the most effective reward for them?</label>
            <select name="reward_type" className="form-select" value={rewardType} onChange={e => setRewardType(e.target.value)} required>
              <option value="">Select reward type...</option>
              <option value="physical">Physical (hugs, tickles)</option>
              <option value="visual">Visual (30 seconds of a favourite video)</option>
              <option value="auditory">Music / Auditory (listening to a favourite song)</option>
              <option value="tangible">Tangible (stickers, small toy)</option>
              <option value="social">Social (praise, high fives)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', alignItems: 'center' }}>
            <Link href="/onboarding/goals" className="btn btn-outline">Back</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Generating Plan...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
