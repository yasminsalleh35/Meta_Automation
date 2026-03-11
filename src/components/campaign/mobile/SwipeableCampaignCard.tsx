
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  MapPin,
  DollarSign
} from 'lucide-react';
import { RealCampaign } from '@/types/realCampaign';
import { getObjectiveFriendlyName } from '@/utils/objectiveNames';

interface SwipeableCampaignCardProps {
  campaign: RealCampaign;
  onStatusChange: (campaignId: string, newStatus: 'active' | 'paused' | 'finished') => void;
  onEdit: (campaignId: string) => void;
  onDelete: (campaignId: string) => void;
  onView?: (campaignId: string) => void;
}

export const SwipeableCampaignCard: React.FC<SwipeableCampaignCardProps> = ({
  campaign,
  onStatusChange,
  onEdit,
  onDelete,
  onView
}) => {
  const [isSwipedLeft, setIsSwipedLeft] = useState(false);
  const [isSwipedRight, setIsSwipedRight] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white text-xs">Ativa</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500 text-white text-xs">Pausada</Badge>;
      case 'finished':
        return <Badge className="bg-gray-500 text-white text-xs">Finalizada</Badge>;
      case 'draft':
        return <Badge className="bg-blue-500 text-white text-xs">Rascunho</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    setCurrentX(e.touches[0].clientX);
    const deltaX = e.touches[0].clientX - startX;
    
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${Math.min(Math.max(deltaX, -100), 100)}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaX = currentX - startX;
    const threshold = 50;
    
    if (deltaX > threshold) {
      setIsSwipedRight(true);
      setIsSwipedLeft(false);
    } else if (deltaX < -threshold) {
      setIsSwipedLeft(true);
      setIsSwipedRight(false);
    } else {
      setIsSwipedLeft(false);
      setIsSwipedRight(false);
    }
    
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(0px)';
    }
    
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setCurrentX(e.clientX);
    const deltaX = e.clientX - startX;
    
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${Math.min(Math.max(deltaX, -100), 100)}px)`;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const deltaX = currentX - startX;
    const threshold = 50;
    
    if (deltaX > threshold) {
      setIsSwipedRight(true);
      setIsSwipedLeft(false);
    } else if (deltaX < -threshold) {
      setIsSwipedLeft(true);
      setIsSwipedRight(false);
    } else {
      setIsSwipedLeft(false);
      setIsSwipedRight(false);
    }
    
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(0px)';
    }
    
    setIsDragging(false);
  };

  const resetSwipe = () => {
    setIsSwipedLeft(false);
    setIsSwipedRight(false);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left Action (Status Change) */}
      {isSwipedRight && (
        <div className="absolute left-0 top-0 h-full w-20 bg-green-500 flex items-center justify-center z-10">
          <Button
            size="sm"
            className="bg-white text-green-600 hover:bg-gray-100 h-10 w-10 p-0 rounded-full"
            onClick={() => {
              if (campaign.status === 'active') {
                onStatusChange(campaign.id, 'paused');
              } else {
                onStatusChange(campaign.id, 'active');
              }
              resetSwipe();
            }}
          >
            {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      )}

      {/* Right Actions */}
      {isSwipedLeft && (
        <div className="absolute right-0 top-0 h-full w-32 bg-red-500 flex items-center justify-center gap-2 z-10">
          <Button
            size="sm"
            className="bg-white text-blue-600 hover:bg-gray-100 h-8 w-8 p-0 rounded-full"
            onClick={() => {
              onEdit(campaign.id);
              resetSwipe();
            }}
          >
            <Edit className="w-3 h-3" />
          </Button>
          {onView && campaign.meta_campaign_id && (
            <Button
              size="sm"
              className="bg-white text-purple-600 hover:bg-gray-100 h-8 w-8 p-0 rounded-full"
              onClick={() => {
                onView(campaign.id);
                resetSwipe();
              }}
            >
              <Eye className="w-3 h-3" />
            </Button>
          )}
          <Button
            size="sm"
            className="bg-white text-red-600 hover:bg-gray-100 h-8 w-8 p-0 rounded-full"
            onClick={() => {
              onDelete(campaign.id);
              resetSwipe();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Main Card */}
      <Card 
        ref={cardRef}
        className="hover:shadow-lg transition-shadow duration-300 border border-gray-200 bg-white relative z-20"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 truncate">
                {campaign.name}
              </h3>
              <p className="text-sm text-gray-500 mb-2 truncate">
                {getObjectiveFriendlyName(campaign.objective)}
              </p>
              {getStatusBadge(campaign.status)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate">
                {campaign.location_city || campaign.location_state || 'Localização não definida'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-bold text-blue-600">
                {formatCurrency(campaign.budget_daily)}/dia
              </span>
            </div>
          </div>

          {/* Swipe Hint */}
          <div className="mt-3 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              ← Deslize para ações • Deslize para status →
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
