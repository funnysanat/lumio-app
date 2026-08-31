"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
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
        <h1 style={{ marginBottom: '0.5rem' }}>Therapist Goals</h1>
        <p style={{ color: '#a1a1aa', marginBottom: '1rem' }}>If your child is currently seeing a therapist (e.g., Speech, Occupational, ABA), what are their primary goals? <br/><strong>This is completely optional.</strong></p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Goal 1</label>
            <select name="goal1" className="form-select">
              <option value="">Select a goal...</option>
              <option value="Improve expressive language (speaking & vocabulary)">Improve expressive language (speaking & vocabulary)</option>
              <option value="Improve receptive language (understanding instructions)">Improve receptive language (understanding instructions)</option>
              <option value="Develop fine motor skills (grasping, writing)">Develop fine motor skills (grasping, writing)</option>
              <option value="Develop gross motor skills (walking, balance)">Develop gross motor skills (walking, balance)</option>
              <option value="Improve social skills (joint attention, play)">Improve social skills (joint attention, play)</option>
              <option value="Increase attention span">Increase attention span</option>
              <option value="Reduce challenging behaviors">Reduce challenging behaviors</option>
              <option value="Improve self-care (dressing, feeding)">Improve self-care (dressing, feeding)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Goal 2</label>
            <select name="goal2" className="form-select">
              <option value="">Select a goal...</option>
              <option value="Improve expressive language (speaking & vocabulary)">Improve expressive language (speaking & vocabulary)</option>
              <option value="Improve receptive language (understanding instructions)">Improve receptive language (understanding instructions)</option>
              <option value="Develop fine motor skills (grasping, writing)">Develop fine motor skills (grasping, writing)</option>
              <option value="Develop gross motor skills (walking, balance)">Develop gross motor skills (walking, balance)</option>
              <option value="Improve social skills (joint attention, play)">Improve social skills (joint attention, play)</option>
              <option value="Increase attention span">Increase attention span</option>
              <option value="Reduce challenging behaviors">Reduce challenging behaviors</option>
              <option value="Improve self-care (dressing, feeding)">Improve self-care (dressing, feeding)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Goal 3</label>
            <select name="goal3" className="form-select">
              <option value="">Select a goal...</option>
              <option value="Improve expressive language (speaking & vocabulary)">Improve expressive language (speaking & vocabulary)</option>
              <option value="Improve receptive language (understanding instructions)">Improve receptive language (understanding instructions)</option>
              <option value="Develop fine motor skills (grasping, writing)">Develop fine motor skills (grasping, writing)</option>
              <option value="Develop gross motor skills (walking, balance)">Develop gross motor skills (walking, balance)</option>
              <option value="Improve social skills (joint attention, play)">Improve social skills (joint attention, play)</option>
              <option value="Increase attention span">Increase attention span</option>
              <option value="Reduce challenging behaviors">Reduce challenging behaviors</option>
              <option value="Improve self-care (dressing, feeding)">Improve self-care (dressing, feeding)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', alignItems: 'center' }}>
            <Link href="/onboarding/child" className="btn btn-outline">Back</Link>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button" 
                className="btn" 
                onClick={() => router.push('/onboarding/interests')}
                style={{ backgroundColor: 'transparent', color: '#a1a1aa' }}
              >
                Skip
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Next Step: Interests'}
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
