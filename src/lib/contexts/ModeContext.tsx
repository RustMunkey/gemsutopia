'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

export type DashboardMode = 'live' | 'dev';

interface ModeContextType {
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DashboardMode>('live');

  const toggleMode = () => {
    setMode(current => current === 'live' ? 'dev' : 'live');
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
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