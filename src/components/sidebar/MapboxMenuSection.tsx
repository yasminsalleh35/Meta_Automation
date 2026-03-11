
import React from 'react';
import { Link } from 'react-router-dom';
import { Map } from 'lucide-react';
import { 
  SidebarMenuButton, 
  SidebarMenuItem 
} from '@/components/ui/sidebar';
import { useUserRole } from '@/hooks/useUserRole';

export function MapboxMenuSection() {
  const { isAdmin } = useUserRole();

  if (!isAdmin) return null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link to="/admin/settings/mapbox">
          <Map className="w-4 h-4" />
          <span>Configurações Mapbox</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
