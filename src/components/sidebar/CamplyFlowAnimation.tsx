import React from 'react';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import logoCamply from '@/assets/logo-camply.png';

export function CamplyFlowAnimation() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center py-2">
        <img 
          src={logoCamply} 
          alt="Camply" 
          className="w-6 h-6 animate-pulse"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {/* Camply Logo */}
      <img 
        src={logoCamply} 
        alt="Camply" 
        className="w-8 h-8 animate-pulse"
      />
      
      {/* Animated Arrows */}
      <ChevronRight 
        className="w-4 h-4 text-gray-400 animate-fade-in" 
        style={{ animationDelay: '0.2s' }}
      />
      <ChevronRight 
        className="w-4 h-4 text-gray-500 animate-fade-in" 
        style={{ animationDelay: '0.4s' }}
      />
      <ChevronRight 
        className="w-4 h-4 text-green-500 animate-fade-in" 
        style={{ animationDelay: '0.6s' }}
      />
      
      {/* WhatsApp Icon with Glow */}
      <MessageCircle 
        className="w-7 h-7 text-green-600 animate-fade-in drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" 
        style={{ animationDelay: '0.8s' }}
        fill="currentColor"
      />
    </div>
  );
}
