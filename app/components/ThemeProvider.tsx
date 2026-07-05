'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { LinkProvider } from '@astryxdesign/core/Link';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import Link from 'next/link';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('system');

  // Load mode from local storage if available on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('astryx-theme-mode') as ThemeMode;
    if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
      setMode(savedMode);
    }
  }, []);

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem('astryx-theme-mode', newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode: handleSetMode }}>
      <Theme theme={neutralTheme} mode={mode}>
        <LinkProvider component={Link}>
          {children}
        </LinkProvider>
      </Theme>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
}
