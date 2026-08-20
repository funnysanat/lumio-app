"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function GoalsPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const goals = [
      formData.get('goal1') as string,
      formData.get('goal2') as string,
      formData.get('goal3') as string,
    ].filter(g => g && g.trim() !== '');

    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/v1/onboarding/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ goals })
      });
      
      if (res.ok) {
        router.push('/onboarding/interests');
      } else {
        alert('Failed to save goals');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '100px', maxWidth: '600px' }}>
      <div className="card">
        <h1 style={{ marginBottom: '0.5rem' }}>Therapist Goals</h1>
        <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>What is your child currently working on? (You can add up to 3 for now)</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Goal 1</label>
            <input name="goal1" type="text" className="form-input" placeholder="e.g. Practice saying 2-word sentences" required />
          </div>

          <div className="form-group">
            <label className="form-label">Goal 2 (Optional)</label>
            <input name="goal2" type="text" className="form-input" placeholder="e.g. Pointing to items they want" />
          </div>

          <div className="form-group">
            <label className="form-label">Goal 3 (Optional)</label>
            <input name="goal3" type="text" className="form-input" placeholder="" />
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <p style={{ fontSize: '0.875rem', margin: 0, color: '#d8b4fe' }}>
              💡 <strong>Tip:</strong> Keep goals simple. Our AI will automatically adapt them into fun activities.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <Link href="/onboarding/child" className="btn btn-outline">Back</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Next Step: Interests'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
