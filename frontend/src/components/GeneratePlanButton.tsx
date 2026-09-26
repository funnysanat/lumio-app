"use client";

import { useState } from 'react';
import { useAuth } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';

interface Props {
  buttonText?: string;
  designingText?: string;
  mode?: string;
}

export default function GeneratePlanButton({ 
  buttonText = "Generate Different Activities", 
  designingText = "Designing...",
  mode = "creative"
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { getToken } = useAuth();
  const router = useRouter();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/v1/dashboard/generate?mode=${mode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        const taskId = data.task_id;
        
        if (taskId) {
          // Poll the backend until the task is complete
          const pollInterval = setInterval(async () => {
            try {
              const statusRes = await fetch(`${API_URL}/api/v1/dashboard/generate/status/${taskId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.status === 'SUCCESS' || statusData.status === 'FAILURE') {
                  clearInterval(pollInterval);
                  setIsGenerating(false);
                  router.refresh(); // Tells Next.js to re-fetch the Server Component data
                }
              }
            } catch (e) {
              console.error("Polling error", e);
            }
          }, 2000);
        } else {
          // Fallback if no task ID
          setTimeout(() => {
            setIsGenerating(false);
            router.refresh();
          }, 12000);
        }
      } else {
        setIsGenerating(false);
        alert("Failed to trigger plan generation.");
      }
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      alert("Error connecting to server.");
    }
  };

  return (
    <>
      <button 
        className="btn btn-outline" 
        style={{ fontSize: '0.875rem' }} 
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? designingText : buttonText}
      </button>

      {isGenerating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fade-in-overlay 0.4s ease-out'
        }}>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes float-therapy {
              0% { transform: translateY(0px) rotate(0deg); filter: drop-shadow(0 4px 10px rgba(14, 165, 233, 0.2)); }
              50% { transform: translateY(-20px) rotate(10deg); filter: drop-shadow(0 15px 20px rgba(14, 165, 233, 0.5)); }
              100% { transform: translateY(0px) rotate(0deg); filter: drop-shadow(0 4px 10px rgba(14, 165, 233, 0.2)); }
            }
            @keyframes fade-in-overlay {
              from { opacity: 0; backdrop-filter: blur(0px); }
              to { opacity: 1; backdrop-filter: blur(4px); }
            }
          `}} />
          
          <div style={{ fontSize: '6rem', animation: 'float-therapy 3s infinite ease-in-out', marginBottom: '1.5rem' }}>
            🧩
          </div>
          
          <h2 style={{ color: '#0f172a', fontSize: '2rem', marginBottom: '1rem', textAlign: 'center', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Designing new activities...
          </h2>
          
          <p style={{ color: '#475569', fontSize: '1.25rem', textAlign: 'center', maxWidth: '450px', lineHeight: 1.6, padding: '0 1.5rem' }}>
            Our AI is carefully curating a fresh, personalized therapy plan tailored specifically to your child&apos;s needs today.
          </p>
        </div>
      )}
    </>
  );
}
