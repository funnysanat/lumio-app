"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function ChildProfilePage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = await getToken();
        if (!token) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/v1/onboarding/child`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.child) {
            setInitialData(json.child);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    fetchProfile();
  }, [getToken]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      first_name: formData.get('first_name'),
      age_range: formData.get('age_range'),
      primary_condition: formData.get('primary_condition'),
      communication_level: formData.get('communication_level'),
      preferred_language: formData.get('preferred_language'),
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

  if (fetching) {
    return <div style={{ paddingTop: '100px', textAlign: 'center', color: '#a1a1aa' }}>Loading profile...</div>;
  }

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '100px', maxWidth: '600px' }}>
      <div className="card">
        <h1 style={{ marginBottom: '0.5rem' }}>Let's get to know your child</h1>
        <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>We'll personalise activities just for them.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Child's First Name</label>
            <input name="first_name" type="text" className="form-input" placeholder="e.g. Arjun" defaultValue={initialData?.first_name || ''} required />
          </div>

          <div className="form-group">
            <label className="form-label">Age Range</label>
            <select name="age_range" className="form-select" defaultValue={initialData?.age_range || ''} required>
              <option value="">Select age...</option>
              <option value="0-2">0 - 2 years</option>
              <option value="3-5">3 - 5 years</option>
              <option value="6-8">6 - 8 years</option>
              <option value="9+">9+ years</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Primary Condition (Optional)</label>
            <select name="primary_condition" className="form-select" defaultValue={initialData?.primary_condition || ''}>
              <option value="">Select condition...</option>
              <option value="autism">Autism Spectrum</option>
              <option value="speech_delay">Speech/Language Delay</option>
              <option value="adhd">ADHD</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Current Communication</label>
            <select name="communication_level" className="form-select" defaultValue={initialData?.communication_level || ''} required>
              <option value="">Select level...</option>
              <option value="sentences">Speaks in sentences</option>
              <option value="words">Uses single words/phrases</option>
              <option value="non_speaking">Non-speaking or minimal</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Preferred App Language</label>
            <select name="preferred_language" className="form-select" required defaultValue={initialData?.preferred_language || 'English'}>
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="Bengali">Bengali (বাংলা)</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Arabic">Arabic (العربية)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            {initialData && (
              <Link href="/dashboard" className="btn btn-outline" style={{ textDecoration: 'none', padding: '0.75rem 1.5rem' }}>
                Cancel
              </Link>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Next Step: Goals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
