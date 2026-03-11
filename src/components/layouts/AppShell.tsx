import React from 'react';
import { Outlet } from 'react-router-dom';

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Simple wrapper for private app area
  return <>{children}</>;
};

export default AppShell;