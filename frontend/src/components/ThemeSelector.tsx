"use client";

import React from 'react';
import { useTheme } from '@/components/ThemeProvider';

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'rose', name: 'Rose', color: '#f43f5e' },
    { id: 'lavender', name: 'Lavender', color: '#a855f7' },
    { id: 'sage', name: 'Sage', color: '#10b981' },
    { id: 'ocean', name: 'Ocean', color: '#0ea5e9' },
  ];

  return (
    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id as any)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            opacity: theme === t.id ? 1 : 0.6,
            transform: theme === t.id ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.2s',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: t.color,
              border: theme === t.id ? `3px solid ${t.color}` : '2px solid transparent',
              boxShadow: theme === t.id ? `0 4px 10px rgba(0,0,0,0.15)` : 'none',
              padding: '2px',
              backgroundClip: 'content-box',
            }}
          />
          <span style={{ fontSize: '0.875rem', fontWeight: theme === t.id ? 600 : 400, color: 'var(--foreground)' }}>
            {t.name}
          </span>
        </button>
      ))}
    </div>
  );
}
