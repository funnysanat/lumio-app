"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import SessionHistory from "./SessionHistory";
import VisualRoadmap from "./VisualRoadmap";
import JourneyRoadmap from "./JourneyRoadmap";
import SkillTracker from "./SkillTracker";
import { useAppStore } from "@/store/useAppStore";

export default function ProgressPage() {
  const { getToken, userId } = useAuth();
  
  const { child, history: cachedHistory, setHistory, setChild, setSkillAverages } = useAppStore();
  const [loading, setLoading] = useState(cachedHistory.length === 0);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    async function fetchData() {
      if (!userId) return;
      try {
        const token = await getToken();
        if (!token) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // Fetch child profile
        try {
          const childRes = await fetch(`${API_URL}/api/v1/onboarding/child`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
          });
          if (childRes.ok) {
            const data = await childRes.json();
            if (data.child) setChild(data.child);
          }
        } catch (err) {
          console.error("Failed to fetch child", err);
        }

        // Fetch session history
        try {
          const historyRes = await fetch(`${API_URL}/api/v1/dashboard/progress/history`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
          });
          if (historyRes.ok) {
            const historyData = await historyRes.json();
            if (historyData.history) setHistory(historyData.history);
            if (historyData.skill_averages) setSkillAverages(historyData.skill_averages);
          }
        } catch (err) {
          console.error("Failed to fetch history", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [getToken, userId, setChild, setHistory]);

  const childName = child?.first_name || "Your Child";

  if (!hasMounted) return null;

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
          <Link href="/settings" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Settings</Link>
          <UserButton />
        </div>
      </header>

      <main className="page-wrapper container-lg animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Progress Tracker</h1>
            <p style={{ color: "var(--muted-foreground)", marginTop: "0.5rem" }}>
              Log home activities via voice notes to get AI-powered insights.
            </p>
          </div>
          <Link href="/dashboard/progress/report" style={{ padding: "0.75rem 1.5rem", background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: "0.5rem", fontWeight: 600, textDecoration: "none" }}>
            📄 View Progress Report
          </Link>
        </div>

        <section style={{ marginBottom: '3rem' }}>
          <JourneyRoadmap />
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Developmental Snapshot</h2>
          <VisualRoadmap />
        </section>
        
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Targeted Skills Progress</h2>
          <SkillTracker />
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Session History</h2>
          <SessionHistory history={cachedHistory} />
        </section>

      </main>
    </div>
  );
}
