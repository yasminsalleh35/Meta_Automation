
import React, { memo } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { useResponsive } from '@/hooks/useResponsive';
import ErrorBoundary from '@/components/ErrorBoundary';

const OptimizedDashboardLayout: React.FC = memo(() => {
  const { isMobile } = useResponsive();

  return (
    <ErrorBoundary>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="min-h-screen flex w-full bg-gray-50 safe-area-viewport">
          <ErrorBoundary>
            <AppSidebar />
          </ErrorBoundary>
          <div className="flex-1 flex flex-col min-w-0">
            <ErrorBoundary>
              {isMobile ? (
                <MobileHeader title="Dashboard" />
              ) : (
                <DashboardHeader />
              )}
            </ErrorBoundary>
            <main className="flex-1 overflow-auto safe-area-inset-bottom">
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative isolate">
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  );
});

OptimizedDashboardLayout.displayName = 'OptimizedDashboardLayout';

export default OptimizedDashboardLayout;
