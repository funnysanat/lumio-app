"use client";

import React from 'react';
import Link from 'next/link';
import { UserButton, useAuth } from '@clerk/nextjs';

export default function PricingPage() {
  const { userId } = useAuth();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="header">
        <Link href="/dashboard" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="14" width="8" height="8" rx="2.5" fill="#38bdf8" />
            <rect x="13" y="14" width="8" height="8" rx="2.5" fill="#a78bfa" />
            <rect x="8" y="5" width="8" height="8" rx="2.5" fill="#f472b6" />
          </svg>
          Lumio AI
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Dashboard</Link>
          {userId ? (
            <UserButton />
          ) : (
            <Link href="/sign-in" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container-lg" style={{ flex: 1, padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ textAlign: 'center', maxWidth: '600px', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1rem', lineHeight: 1.2 }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)' }}>
            Choose the level of support your family needs. Upgrade anytime as your child&apos;s needs evolve.
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          
          {/* Basic Tier */}
          <div className="card" style={{ flex: '1 1 350px', maxWidth: '400px', padding: '2.5rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>Basic</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
              Free
            </div>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem', minHeight: '48px' }}>
              Perfect for getting started with AI-generated home activities.
            </p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--foreground)' }}>
                <span style={{ color: '#10b981' }}>✓</span> 3 AI Activities per week
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--foreground)' }}>
                <span style={{ color: '#10b981' }}>✓</span> Basic progress tracking
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--foreground)' }}>
                <span style={{ color: '#10b981' }}>✓</span> Pay-per-session marketplace access
              </li>
            </ul>
            
            <button className="btn btn-outline" style={{ width: '100%', padding: '1rem' }}>Current Plan</button>
          </div>

          {/* Premier Tier (Highlighted) */}
          <div className="card" style={{ flex: '1 1 350px', maxWidth: '400px', padding: '2.5rem', display: 'flex', flexDirection: 'column', border: '2px solid var(--primary)', position: 'relative', transform: 'scale(1.05)', zIndex: 10, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--primary)', color: 'white', padding: '0.25rem 1rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 700 }}>
              MOST POPULAR
            </div>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>Premier Plan</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
              $199<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--muted-foreground)' }}>/mo</span>
            </div>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem', minHeight: '48px' }}>
              Comprehensive parent coaching and dedicated 1-on-1 therapist support.
            </p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--foreground)' }}>
                <span style={{ color: '#10b981' }}>✓</span> <strong style={{color: 'var(--primary)'}}>Dedicated Expert Coach</strong>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--foreground)' }}>
                <span style={{ color: '#10b981' }}>✓</span> Unlimited chat & video microconsultations
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--foreground)' }}>
                <span style={{ color: '#10b981' }}>✓</span> Unlimited AI daily activity plans
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--foreground)' }}>
                <span style={{ color: '#10b981' }}>✓</span> Weekly 30-minute video check-ins
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--foreground)' }}>
                <span style={{ color: '#10b981' }}>✓</span> Priority booking in marketplace
              </li>
            </ul>
            
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}>Upgrade to Premier</button>
          </div>

        </div>
      </main>
    </div>
  );
}
