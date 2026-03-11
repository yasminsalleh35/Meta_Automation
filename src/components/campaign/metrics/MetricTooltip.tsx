
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { getMetricTooltip } from '@/utils/metricTooltips';

interface MetricTooltipProps {
  metric: string;
  objective?: string;
  children: React.ReactNode;
}

export const MetricTooltip: React.FC<MetricTooltipProps> = ({ 
  metric, 
  objective, 
  children 
}) => {
  const tooltipInfo = getMetricTooltip(metric, objective);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help relative group">
            {children}
            <HelpCircle className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1 -right-1" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3 bg-gray-900 text-white rounded-lg shadow-xl">
          <div className="font-semibold mb-1">{tooltipInfo.title}</div>
          <div className="text-sm text-gray-200">{tooltipInfo.description}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
