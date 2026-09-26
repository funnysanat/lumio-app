"use client";

import React from 'react';
import { useAppStore } from '@/store/useAppStore';

export default function SkillTracker() {
  const { skillAverages } = useAppStore();

  if (!skillAverages || Object.keys(skillAverages).length === 0) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>
        No skill data available yet. Complete activities to track progress!
      </div>
    );
  }

  // Format domain names nicely
  const formatDomainName = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <p style={{ color: '#a1a1aa', margin: '0 0 1.5rem 0', fontSize: '0.875rem' }}>
        Average independence scores (0-4) based on your recent activity logs.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {Object.entries(skillAverages).map(([skill, score], index) => {
          const color = colors[index % colors.length];
          // Score is 0 to 4. Calculate percentage.
          const percentage = (score / 4) * 100;
          
          let masteryLabel = "Emerging";
          if (score >= 3.5) masteryLabel = "Mastery";
          else if (score >= 2.5) masteryLabel = "Mild Support";
          else if (score >= 1.5) masteryLabel = "Moderate Support";
          else if (score >= 0.5) masteryLabel = "Max Support";

          return (
            <div key={skill} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--foreground)' }}>{formatDomainName(skill)}</h4>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: color }}>{score.toFixed(1)}</span>
              </div>
              
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--card-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', width: `${percentage}%`, 
                  backgroundColor: color, borderRadius: '4px', transition: 'width 1s ease-out' 
                }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                <span>Support Level:</span>
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{masteryLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
