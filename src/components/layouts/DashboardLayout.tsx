
import React, { useState } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { TrialBanner } from '@/components/trial/TrialBanner';
import { useResponsive } from '@/hooks/useResponsive';
import ErrorBoundary from '@/components/ErrorBoundary';

const DashboardLayout: React.FC = () => {
  const { isMobile } = useResponsive();
  const [searchParams] = useSearchParams();
  
  // Check if user just completed trial setup or subscription
  const trialJustStarted = searchParams.get('trial') === 'active';
  const subscriptionActive = searchParams.get('subscription') === 'active';

  return (
    <ErrorBoundary>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="min-h-screen flex w-full bg-gray-50">
          {/* 🚫 TRIAL BANNER DESATIVADO - Não exibir avisos de assinatura */}
          {/* <div className="fixed top-0 left-0 right-0 z-40">
            <TrialBanner />
          </div> */}
          
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
            <main className="flex-1 overflow-auto pt-0">
              <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
                {/* Success Message - Only for paid subscription */}
                {subscriptionActive && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-5 h-5 text-blue-400 mr-3">🎉</div>
                      <div>
                        <h3 className="text-sm font-medium text-blue-800">Assinatura ativada!</h3>
                        <p className="text-xs text-blue-700 mt-1">Bem-vindo ao Camply Premium!</p>
                      </div>
                    </div>
                  </div>
                )}

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
};

export default DashboardLayout;
