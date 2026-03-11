import React, { useState, useEffect } from 'react';

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

export const SimpleMessagesAnimation: React.FC = () => {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const maxVisibleMessages = 3;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const showNextMessage = () => {
      if (currentIndex >= messages.length) {
        // Reset animation after showing all messages
        timeoutId = setTimeout(() => {
          setVisibleMessages([]);
          setCurrentIndex(0);
          setAnimationKey(prev => prev + 1);
        }, 2000);
        return;
      }

      // Add new message
      timeoutId = setTimeout(() => {
        setVisibleMessages(prev => {
          const newMessages = [...prev, messages[currentIndex]];
          return newMessages.slice(-maxVisibleMessages);
        });
        setCurrentIndex(prev => prev + 1);
      }, currentIndex === 0 ? 1000 : 2000);
    };

    showNextMessage();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentIndex, animationKey]);

  return (
    <div className="relative max-w-md mx-auto h-80 overflow-hidden">
      <div className="relative h-full flex flex-col justify-end p-4">
        {visibleMessages.map((message, index) => {
          const avatarColors = [
            'from-blue-400 to-blue-600',
            'from-purple-400 to-purple-600', 
            'from-green-400 to-green-600',
            'from-orange-400 to-orange-600',
            'from-pink-400 to-pink-600',
            'from-indigo-400 to-indigo-600'
          ];
          
          return (
            <div
              key={`${message.id}-${animationKey}-${index}`}
              className="mb-3 last:mb-0 animate-fade-in"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${avatarColors[message.id % avatarColors.length]} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg`}>
                  {message.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-xs text-gray-900 truncate">{message.name}</p>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{message.time}</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{message.message}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};