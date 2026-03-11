
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { useResponsive } from '@/hooks/useResponsive';

interface QuickAction {
  to: string;
  icon: React.ComponentType<any>;
  title: string;
  mobileTitle?: string;
  description: string;
  mobileDescription?: string;
  gradient: string;
  hoverColor: string;
}

interface MobileQuickActionsProps {
  actions: QuickAction[];
}

export function MobileQuickActions({ actions }: MobileQuickActionsProps) {
  const { isMobile } = useResponsive();

  return (
    <ResponsiveGrid cols={{ default: 1, sm: 2, md: 3 }} gap={4} className="sm:gap-6">
      {actions.map((action, index) => (
        <Link key={index} to={action.to} className="block">
          <Card className="hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-gray-50 to-white hover:scale-105 group cursor-pointer min-h-[140px] sm:min-h-[160px] touch-target">
            <CardContent className="p-5 sm:p-7 text-center h-full flex flex-col justify-center">
              <div className={`p-4 sm:p-5 bg-gradient-to-r ${action.gradient} rounded-xl w-14 h-14 sm:w-18 sm:h-18 mx-auto mb-4 sm:mb-5 flex items-center justify-center`}>
                <action.icon className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
              </div>
              <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 ${action.hoverColor} transition-colors leading-tight`}>
                {isMobile && action.mobileTitle ? action.mobileTitle : action.title}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {isMobile && action.mobileDescription ? action.mobileDescription : action.description}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </ResponsiveGrid>
  );
}
