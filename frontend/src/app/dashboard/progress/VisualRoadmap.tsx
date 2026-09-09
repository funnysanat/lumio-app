"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

type SnapshotData = {
  assessment_date: string;
  chronological_age_months: number;
  domain_scores: Record<string, string>;
  next_milestones: Record<string, string[]>;
};

export default function VisualRoadmap() {
  const { getToken } = useAuth();
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssessment() {
      try {
        const token = await getToken();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/v1/onboarding/assessment`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setSnapshot(data.snapshot);
        }
      } catch (err) {
        console.error("Failed to fetch assessment", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAssessment();
  }, [getToken]);

  if (loading) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>
        Loading your child's roadmap...
      </div>
    );
  }

  if (!snapshot || !snapshot.domain_scores || Object.keys(snapshot.domain_scores).length === 0) {
    return null;
  }

  // Predefined age bands to calculate relative progress
  const ageBands = ["0-6 months", "6-12 months", "12-18 months", "18-24 months", "24-36 months", "36-48 months"];

  // Format domain names nicely
  const formatDomainName = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').trim();
  };

  const colors = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b'];

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <p style={{ color: '#a1a1aa', margin: '0 0 1.5rem 0', fontSize: '0.875rem' }}>
        See where your child is currently at and what they are working towards.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {Object.entries(snapshot.domain_scores)
          .filter(([key]) => key !== "_checked_ids") // Filter out raw DB data
          .map(([domain, currentLevel], index) => {
            const nextMilestonesList = snapshot.next_milestones[domain] || [];
            const color = colors[index % colors.length];
            
            // Calculate a rough progress percentage just for visual bar representation
            const bandIndex = ageBands.indexOf(currentLevel);
            const progressPercent = bandIndex !== -1 ? Math.min(100, Math.max(15, (bandIndex + 1) * (100 / ageBands.length))) : 20;

            return (
              <div key={domain} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#cbd5e1' }}>{formatDomainName(domain)}</h3>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', backgroundColor: `${color}33`, color: color }}>
                    Current: {currentLevel}
                  </span>
                </div>

                {/* The Journey Track (Progress Bar) */}
                <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', position: 'relative', marginTop: '0.5rem' }}>
                  {/* Fill line */}
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, height: '100%', width: `${progressPercent}%`, 
                    backgroundColor: color, borderRadius: '4px', transition: 'width 1s ease-out' 
                  }} />
                  
                  {/* Current Node */}
                  <div style={{ 
                    position: 'absolute', top: '50%', left: `${progressPercent}%`, 
                    transform: 'translate(-50%, -50%)', width: '16px', height: '16px', 
                    backgroundColor: '#fff', border: `3px solid ${color}`, borderRadius: '50%', 
                    boxShadow: '0 0 8px rgba(0,0,0,0.5)', zIndex: 2
                  }} />
                  
                  {/* Next Milestone Node (Faded) */}
                  <div style={{ 
                    position: 'absolute', top: '50%', left: `${Math.min(100, progressPercent + 20)}%`, 
                    transform: 'translate(-50%, -50%)', width: '12px', height: '12px', 
                    backgroundColor: 'transparent', border: `2px dashed ${color}`, borderRadius: '50%', 
                    opacity: 0.6, zIndex: 1
                  }} />
                </div>

                {/* Next Milestones Text */}
                {nextMilestonesList.length > 0 && (
                  <div style={{ 
                    marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                    borderRadius: '0.5rem', borderLeft: `2px solid ${color}` 
                  }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Up Next
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#e2e8f0', fontSize: '0.875rem' }}>
                      {nextMilestonesList.map((m, idx) => (
                        <li key={idx} style={{ marginBottom: idx === nextMilestonesList.length - 1 ? 0 : '0.25rem' }}>
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
        })}
      </div>
    </div>
  );
}
