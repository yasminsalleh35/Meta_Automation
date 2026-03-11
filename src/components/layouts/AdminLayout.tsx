
import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminHeader } from '@/components/AdminHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useResponsive } from '@/hooks/useResponsive';
import { MapboxProvider } from '@/contexts/MapboxContext';

const AdminLayout: React.FC = () => {
  const { isMobile } = useResponsive();

  return (
    <MapboxProvider>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="min-h-screen flex w-full bg-gray-50">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {isMobile ? (
              <MobileHeader title="Admin Panel" />
            ) : (
              <AdminHeader />
            )}
            <main className="flex-1 overflow-auto">
              <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </MapboxProvider>
  );
};

export default AdminLayout;
