
import React from 'react';
import { MessageCircle } from 'lucide-react';

export const WhatsAppFlowAnimation: React.FC = () => {
  return (
    <div className="relative flex items-center">
      <div className="flex items-center space-x-1">
        <MessageCircle className="w-4 h-4 text-green-600" />
        <span className="text-xs text-green-700 font-medium">Enviando</span>
      </div>
      
      {/* Animated dots */}
      <div className="flex space-x-1 ml-2">
        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
      </div>

      {/* Flow animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-2 h-2 bg-green-400 rounded-full opacity-70 animate-ping" style={{ animationDuration: '2s' }}></div>
      </div>
    </div>
  );
};
