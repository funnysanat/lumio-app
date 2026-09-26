"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'rose' | 'lavender' | 'sage' | 'ocean';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('rose');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from local storage on mount
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      // Use setTimeout to avoid synchronous state update during render
      setTimeout(() => setThemeState(savedTheme), 0);
    } else {
      document.documentElement.setAttribute('data-theme', 'rose');
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Render provider immediately to prevent hydration structural mismatch
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
