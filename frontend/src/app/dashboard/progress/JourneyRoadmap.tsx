"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

type SnapshotData = {
  assessment_date: string;
  chronological_age_months: number;
  domain_scores: Record<string, string>;
  next_milestones: Record<string, string[]>;
};

// Hardcoded developmental sequence for demonstration
// The roadmap will represent a single domain's journey (e.g., Expressive Language or an aggregate)
// For MVP, we will show standard age bands as steps.
const ROADMAP_STEPS = [
  { id: 1, title: "0-6 Months", desc: "Smiles, babbles, reaches for objects", band: "0-6 months" },
  { id: 2, title: "6-12 Months", desc: "Pincer grasp, says mama/dada", band: "6-12 months" },
  { id: 3, title: "12-18 Months", desc: "Walks alone, 5-10 words", band: "12-18 months" },
  { id: 4, title: "18-24 Months", desc: "Runs well, 2-word phrases", band: "18-24 months" },
  { id: 5, title: "24-36 Months", desc: "Asks questions, jumps", band: "24-36 months" },
  { id: 6, title: "36-48 Months", desc: "Uses sentences, climbs", band: "36-48 months" },
];

export default function JourneyRoadmap() {
  const { getToken } = useAuth();
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [gender, setGender] = useState<string>("other");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getToken();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // Fetch Assessment
        const resAsses = await fetch(`${API_URL}/api/v1/onboarding/assessment`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resAsses.ok) {
          const data = await resAsses.json();
          setSnapshot(data.snapshot);
        }

        // Fetch Child Profile
        const resChild = await fetch(`${API_URL}/api/v1/onboarding/child`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resChild.ok) {
          const data = await resChild.json();
          setGender(data.child?.gender?.toLowerCase() || "other");
        }

      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [getToken]);

  if (loading) {
    return <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>Loading roadmap...</div>;
  }

  // Calculate the highest achieved band across all domains to represent the overall journey
  let maxBandIndex = -1;
  let currentBand = "0-6 months";
  
  if (snapshot?.domain_scores) {
    const scores = snapshot.domain_scores;
    const bandKeys = ["0-6 months", "6-12 months", "12-18 months", "18-24 months", "24-36 months", "36-48 months"];
    
    Object.values(scores).forEach(band => {
      if (typeof band === 'string') {
        const idx = bandKeys.indexOf(band);
        if (idx > maxBandIndex) {
          maxBandIndex = idx;
          currentBand = band;
        }
      }
    });
  }
  
  // If no snapshot or scores, default to step 1 (index 0) or middle if preferred
  const currentIndex = ROADMAP_STEPS.findIndex(s => s.band === currentBand) !== -1 
    ? ROADMAP_STEPS.findIndex(s => s.band === currentBand) 
    : 0; 

  const pointerEmoji = gender === 'male' ? '👦' : (gender === 'female' ? '👧' : '👶');

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <p style={{ color: '#a1a1aa', margin: '0 0 1.5rem 0', fontSize: '0.875rem' }}>
        The Journey: Developmental Milestones
      </p>

      {/* Roadmap Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '900px', // Fixed height to show the full road
        backgroundImage: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%), url(/roadmap_bg.jpg)',
        backgroundBlendMode: 'overlay, normal',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
      }}>
        
        {/* Overlay Cards */}
        {ROADMAP_STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          // Absolute positioning logic to follow the S-curve roughly
          // We alternate left and right
          const isLeft = index % 2 === 0;
          
          // Vertical spacing
          const topPercent = 5 + (index * 16); // 5%, 21%, 37%...
          
          // Theme colors from Visual Roadmap
          const themeColors = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b'];
          const baseColor = themeColors[index % themeColors.length];
          // Lighter version for the cards
          const backgroundColor = isCurrent ? `${baseColor}80` : (isCompleted ? `${baseColor}40` : 'rgba(51, 65, 85, 0.4)');

          return (
            <div 
              key={step.id}
              style={{
                position: 'absolute',
                top: `${topPercent}%`,
                [isLeft ? 'left' : 'right']: '10%',
                width: '35%',
                minWidth: '200px',
                backgroundColor: backgroundColor,
                padding: '1rem',
                borderRadius: '0.75rem',
                border: isCurrent ? `2px solid ${baseColor}` : '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                transform: isCurrent ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease',
                zIndex: isCurrent ? 10 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ 
                  width: '24px', height: '24px', borderRadius: '50%', 
                  backgroundColor: 'white', color: '#0f172a', 
                  display: 'flex', justifyContent: 'center', alignItems: 'center', 
                  fontWeight: 'bold', fontSize: '0.75rem' 
                }}>
                  {step.id}
                </div>
                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>{step.title}</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: isCompleted || isCurrent ? '#f1f5f9' : '#94a3b8' }}>
                {step.desc}
              </p>
              
              {/* Pointer / Status Indicator */}
              {isCurrent && (
                <div style={{
                  position: 'absolute',
                  [isLeft ? 'right' : 'left']: '-40px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  animation: 'pulse 2s infinite'
                }}>
                  <div style={{
                    width: '40px', height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    borderRadius: '50%', border: '3px solid #ec4899',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    boxShadow: '0 0 15px rgba(236, 72, 153, 0.5)',
                    fontSize: '1.5rem'
                  }}>
                    {pointerEmoji}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { transform: translateY(-50%) scale(1); }
          50% { transform: translateY(-50%) scale(1.2); }
          100% { transform: translateY(-50%) scale(1); }
        }
      `}} />
    </div>
  );
}
