'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DashboardMode = 'live' | 'dev';

interface ModeContextType {
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DashboardMode>('live');

  // Check mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('dashboard-mode') as DashboardMode;
    if (savedMode === 'dev' || savedMode === 'live') {
      setMode(savedMode);
    }
  }, []);

  const handleSetMode = (newMode: DashboardMode) => {
    setMode(newMode);
    localStorage.setItem('dashboard-mode', newMode);
  };

  const toggleMode = () => {
    const newMode = mode === 'live' ? 'dev' : 'live';
    handleSetMode(newMode);
  };

  return (
    <ModeContext.Provider value={{ mode, setMode: handleSetMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}