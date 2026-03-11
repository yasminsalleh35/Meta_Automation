
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, Minimize2 } from 'lucide-react';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useAuth } from '@/contexts/AuthContext';

interface ChatWidgetProps {
  onClose?: () => void;
}

export function ChatWidget({ onClose }: ChatWidgetProps) {
  const { user } = useAuth();
  const { tickets, responses, createTicket, respondToTicket, loadTicketResponses } = useSupportTickets();
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [showTicketForm, setShowTicketForm] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [responses]);

  useEffect(() => {
    // Verificar se há um ticket aberto para este usuário
    const openTicket = tickets.find(t => t.status === 'open' || t.status === 'in_progress');
    if (openTicket) {
      setCurrentTicket(openTicket);
      setShowTicketForm(false);
      loadTicketResponses(openTicket.id);
    }
  }, [tickets]);

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) return;

    const ticket = await createTicket(subject, message, 'medium', 'chat');
    if (ticket) {
      setCurrentTicket(ticket);
      setShowTicketForm(false);
      setSubject('');
      setMessage('');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentTicket) return;

    await respondToTicket(currentTicket.id, message);
    setMessage('');
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96">
      <Card className="h-full flex flex-col shadow-xl">
        <CardHeader className="bg-blue-600 text-white rounded-t-lg p-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat de Suporte
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0 text-white hover:bg-blue-700"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0 text-white hover:bg-blue-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {!user ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-sm text-gray-500 text-center">
                Faça login para usar o chat de suporte
              </p>
            </div>
          ) : showTicketForm ? (
            <div className="flex-1 p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Assunto</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Como podemos ajudar?"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Mensagem</label>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descreva sua dúvida..."
                  className="text-sm"
                />
              </div>
              <Button
                onClick={handleCreateTicket}
                disabled={!subject.trim() || !message.trim()}
                className="w-full text-sm"
              >
                Iniciar Chat
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {currentTicket && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        #{currentTicket.id.slice(0, 8)}
                      </Badge>
                      <Badge 
                        className={`text-xs ${
                          currentTicket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                          currentTicket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {currentTicket.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium">{currentTicket.subject}</p>
                  </div>
                )}

                {responses[currentTicket?.id]?.map((response, index) => (
                  <div
                    key={response.id}
                    className={`flex ${response.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-2 rounded-lg text-xs ${
                        response.user_id === user?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p>{response.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(response.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    size="sm"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
