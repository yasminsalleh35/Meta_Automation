
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Eye, BarChart3, Copy, Loader2 } from 'lucide-react';
import { SimpleCampaignListItem } from '@/hooks/useSimpleCampaignList';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';

interface SimpleCampaignListActionsProps {
  campaign: SimpleCampaignListItem;
  onPause: () => void;
  onActivate: () => void;
  onDuplicate?: () => void;
  isDuplicating?: boolean;
}

export const SimpleCampaignListActions: React.FC<SimpleCampaignListActionsProps> = ({
  campaign,
  onPause,
  onActivate,
  onDuplicate,
  isDuplicating
}) => {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {campaign.status === 'ACTIVE' ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                className="p-2"
              >
                <Pause className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pausar campanha</p>
            </TooltipContent>
          </Tooltip>
        ) : campaign.status === 'PAUSED' ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onActivate}
                className="p-2"
              >
                <Play className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ativar campanha</p>
            </TooltipContent>
          </Tooltip>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="p-2"
              asChild
            >
              <Link to={`/dashboard/simple-campaign-insights/${campaign.campaignId}`}>
                <BarChart3 className="w-4 h-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver insights detalhados</p>
          </TooltipContent>
        </Tooltip>

        {onDuplicate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="p-2"
                onClick={onDuplicate}
                disabled={isDuplicating}
              >
                {isDuplicating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Duplicar campanha</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="p-2"
              onClick={() => {
                console.log('Ver detalhes:', campaign.campaignId);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver detalhes</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
