"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function InterestsPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      interests: formData.get('interests'),
      reward_type: formData.get('reward_type'),
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

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '100px', maxWidth: '600px' }}>
      <div className="card">
        <h1 style={{ marginBottom: '0.5rem' }}>Interests & Rewards</h1>
        <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>We'll use these to theme activities and suggest rewards.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">What are their current favourite interests?</label>
            <input name="interests" type="text" className="form-input" placeholder="e.g. Trains, Dinosaurs, Water play" required />
          </div>

          <div className="form-group">
            <label className="form-label">What is the most effective reward for them?</label>
            <select name="reward_type" className="form-select" required>
              <option value="">Select reward type...</option>
              <option value="physical">Physical (hugs, tickles)</option>
              <option value="visual">Visual (30 seconds of a favourite video)</option>
              <option value="tangible">Tangible (stickers, small toy)</option>
              <option value="social">Social (praise, high fives)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <Link href="/onboarding/goals" className="btn btn-outline">Back</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Generating Plan...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
