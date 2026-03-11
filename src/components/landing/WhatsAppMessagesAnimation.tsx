import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, Video, MoreVertical } from 'lucide-react';

interface Message {
  id: number;
  name: string;
  message: string;
  time: string;
  avatar: string;
}

const messages: Message[] = [
  {
    id: 1,
    name: "Ana Silva",
    message: "Dra. Marina, vi seu anúncio sobre clareamento! Pode me passar o valor?",
    time: "09:23",
    avatar: "AS"
  },
  {
    id: 2,
    name: "Carlos Mendes",
    message: "Olá doutor! Gostaria de agendar consulta para aparelho ortodôntico",
    time: "10:15",
    avatar: "CM"
  },
  {
    id: 3,
    name: "Maria Santos",
    message: "Boa tarde! Quanto custa uma lente de contato dental?",
    time: "11:42",
    avatar: "MS"
  },
  {
    id: 4,
    name: "João Pedro",
    message: "Dr. Carlos, meu dente quebrou. Tem horário hoje?",
    time: "13:18",
    avatar: "JP"
  },
  {
    id: 5,
    name: "Fernanda Lima",
    message: "Olá! Vi que faz harmonização facial. Posso agendar?",
    time: "14:30",
    avatar: "FL"
  },
  {
    id: 6,
    name: "Roberto Costa",
    message: "Doutora, preciso de canal. Qual o preço?",
    time: "15:47",
    avatar: "RC"
  }
];

export const WhatsAppMessagesAnimation: React.FC = () => {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const showNextMessage = () => {
      if (currentIndex >= messages.length) {
        // Reset animation
        setTimeout(() => {
          setVisibleMessages([]);
          setCurrentIndex(0);
        }, 2000);
        return;
      }

      // Show typing indicator
      setIsTyping(true);
      
      setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages(prev => [...prev, messages[currentIndex]]);
        setCurrentIndex(prev => prev + 1);
      }, 1500);
    };

    const timer = setTimeout(showNextMessage, currentIndex === 0 ? 500 : 2500);
    return () => clearTimeout(timer);
  }, [currentIndex, visibleMessages]);

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="bg-background rounded-xl overflow-hidden shadow-2xl border border-border/50 relative">
        
        {/* WhatsApp Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-sm font-bold shadow-inner">
              C
            </div>
            <div>
              <h3 className="font-semibold text-sm">Camply - Leads</h3>
              <p className="text-xs text-green-100 animate-pulse">● online</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <Video className="w-5 h-5 opacity-80 hover:opacity-100 transition-opacity" />
            <Phone className="w-5 h-5 opacity-80 hover:opacity-100 transition-opacity" />
            <MoreVertical className="w-5 h-5 opacity-80 hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Messages Container */}
        <div className="p-6 space-y-4 h-96 overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 relative">
          
          {/* Notification Badge */}
          {visibleMessages.length > 0 && (
            <div className="absolute top-6 right-6 z-10">
              <div className="relative">
                <div className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
                  {visibleMessages.length}
                </div>
                <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
          )}

          {/* Messages List */}
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {visibleMessages.map((message, index) => {
              const avatarColors = [
                'bg-gradient-to-br from-blue-400 to-blue-600',
                'bg-gradient-to-br from-purple-400 to-purple-600',
                'bg-gradient-to-br from-pink-400 to-pink-600',
                'bg-gradient-to-br from-indigo-400 to-indigo-600',
                'bg-gradient-to-br from-teal-400 to-teal-600',
                'bg-gradient-to-br from-orange-400 to-orange-600'
              ];
              
              return (
                <div
                  key={message.id}
                  className="flex items-start space-x-3 animate-slide-in-bottom opacity-0"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className={`w-10 h-10 ${avatarColors[index % avatarColors.length]} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md`}>
                    {message.avatar}
                  </div>
                  <div className="flex-1 min-w-0 max-w-lg">
                    <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 relative">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-sm text-slate-900 truncate">{message.name}</p>
                        <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{message.time}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed break-words">{message.message}</p>
                      <div className="flex justify-end mt-2">
                        <div className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-3 animate-fade-in">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100">
                  <div className="flex space-x-1 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-xs text-gray-500 ml-2">digitando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Icon */}
          <div className="absolute bottom-6 right-6">
            <div className="relative">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-30"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-xl blur-xl"></div>
    </div>
  );
};