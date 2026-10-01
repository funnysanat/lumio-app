"use client";

import React from 'react';
import Link from 'next/link';
import { UserButton, useAuth } from '@clerk/nextjs';
import SideDrawer from '@/components/SideDrawer';

export default function PricingPage() {
  const { userId } = useAuth();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <SideDrawer />
          <Link href="/dashboard" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="14" width="8" height="8" rx="2.5" fill="#38bdf8" />
              <rect x="13" y="14" width="8" height="8" rx="2.5" fill="#a78bfa" />
              <rect x="8" y="5" width="8" height="8" rx="2.5" fill="#f472b6" />
            </svg>
            Lumio AI
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
        
        <div style={{ textAlign: 'center', maxWidth: '600px', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1rem', lineHeight: 1.2, letterSpacing: '-0.03em' }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--muted-foreground)', lineHeight: 1.6, margin: '0 auto' }}>
            Choose the level of support your family needs. Upgrade anytime as your child&apos;s needs evolve.
          </p>
        </div>

        {/* Pricing List View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '800px' }}>
          
          {/* Premier Tier (Highlighted) */}
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', border: '2px solid var(--primary)', position: 'relative', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--primary)', color: 'white', padding: '0.25rem 1rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
              MOST POPULAR
            </div>
            
            <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>Premier Plan</h3>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>
                  $199<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--muted-foreground)' }}>/mo</span>
                </div>
              </div>
              
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <p style={{ color: 'var(--foreground)', fontWeight: 600, textAlign: 'center', margin: '0 0 1rem 0' }}>
                  Comprehensive parent coaching and dedicated 1-on-1 therapist support.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
                    <span style={{ color: '#10b981' }}>✓</span> <strong style={{color: 'var(--primary)'}}>Dedicated Expert Coach</strong>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
                    <span style={{ color: '#10b981' }}>✓</span> Unlimited chat & video microconsultations
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
                    <span style={{ color: '#10b981' }}>✓</span> Weekly 30-minute video check-ins
                  </li>
                </ul>
              </div>
            </div>
            
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}>Upgrade to Premier</button>
          </div>

          {/* Basic Tier */}
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
            <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>Basic</h3>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)' }}>
                  Free
                </div>
              </div>
              
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', margin: '0 0 1rem 0' }}>
                  Perfect for getting started with AI-generated home activities.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
                    <span style={{ color: '#10b981' }}>✓</span> 3 AI Activities per week
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
                    <span style={{ color: '#10b981' }}>✓</span> Pay-per-session marketplace access
                  </li>
                </ul>
              </div>
            </div>
            
            <button className="btn btn-outline" style={{ width: '100%', padding: '1rem' }}>Current Plan</button>
          </div>
        </div>
      </main>
    </div>
  );
}
