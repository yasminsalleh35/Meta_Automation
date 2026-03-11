
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  demoData: any;
  setDemoData: (data: any) => void;
  isLoading: boolean;
  canControlDemoMode: boolean;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

interface DemoModeProviderProps {
  children: ReactNode;
}

export const DemoModeProvider: React.FC<DemoModeProviderProps> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoData, setDemoData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const toggleDemoMode = () => {
    setIsLoading(true);
    setIsDemoMode(!isDemoMode);
    setTimeout(() => setIsLoading(false), 500); // Simulate loading
  };

  // For now, assume all users can control demo mode
  // This can be enhanced later with proper role checking
  const canControlDemoMode = true;

  const value = {
    isDemoMode,
    toggleDemoMode,
    demoData,
    setDemoData,
    isLoading,
    canControlDemoMode
  };

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};
