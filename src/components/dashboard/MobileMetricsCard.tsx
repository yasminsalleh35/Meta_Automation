
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';

interface MobileMetricsCardProps {
  title: string;
  mobileTitle?: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<any>;
  color: string;
  className?: string;
}

export function MobileMetricsCard({
  title,
  mobileTitle,
  value,
  change,
  trend,
  icon: Icon,
  color,
  className = ""
}: MobileMetricsCardProps) {
  const { isMobile } = useResponsive();

  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/20 touch-target min-h-[120px] sm:min-h-[140px] flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`p-2 sm:p-2.5 bg-gradient-to-r ${color} rounded-lg sm:rounded-xl`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
        </div>
        <Badge className={`${
          trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        } border-0 text-xs sm:text-sm px-2 py-1 rounded-full`}>
          {trend === 'up' ? (
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          ) : (
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          )}
          {change.split(' ')[0]}
        </Badge>
      </div>
      <div className="flex-1 flex flex-col justify-end">
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-white leading-tight">{value}</div>
        <div className="text-green-100 text-sm sm:text-base leading-relaxed">
          {isMobile && mobileTitle ? mobileTitle : title}
        </div>
      </div>
    </div>
  );
}
