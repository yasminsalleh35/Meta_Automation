
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/use-toast';

const Support: React.FC = () => {
  const { tickets, createTicket, isLoading } = useSupportTickets();
  const { toast } = useToast();
  
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'general' as 'general' | 'technical' | 'billing' | 'feature'
  });

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o assunto e a descrição do ticket",
        variant: "destructive"
      });
      return;
    }

    const ticket = await createTicket(
      newTicket.subject,
      newTicket.description,
      newTicket.priority,
      newTicket.category
    );
    if (ticket) {
      toast({
        title: "✅ Ticket criado",
        description: `Ticket criado com sucesso. ID: ${ticket.id}`,
      });
      setNewTicket({
        subject: '',
        description: '',
        priority: 'medium',
        category: 'general'
      });
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'resolved': return 'default';
      case 'in_progress': return 'secondary';
      case 'open': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'in_progress': return <AlertCircle className="h-3 w-3 mr-1" />;
      case 'open': return <AlertCircle className="h-3 w-3 mr-1" />;
      default: return <AlertCircle className="h-3 w-3 mr-1" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved': return 'Resolvido';
      case 'in_progress': return 'Em andamento';
      case 'open': return 'Aberto';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Suporte</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Falar com Suporte
          </CardTitle>
          <CardDescription>
            Entre em contato diretamente via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            asChild
          >
            <a 
              href="https://wa.me/5533998581155" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Abrir WhatsApp
            </a>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Abrir Novo Ticket</CardTitle>
            <CardDescription>
              Descreva seu problema ou dúvida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Assunto</label>
                <Input 
                  placeholder="Descreva brevemente o problema" 
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea 
                  placeholder="Detalhe seu problema ou dúvida" 
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <Select value={newTicket.category} onValueChange={(value: any) => setNewTicket(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="billing">Cobrança</SelectItem>
                    <SelectItem value="feature">Novo Recurso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Prioridade</label>
                <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateTicket}
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isLoading ? 'Criando...' : 'Criar Ticket'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meus Tickets</CardTitle>
            <CardDescription>
              Acompanhe o status dos seus chamados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Carregando tickets...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum ticket encontrado</p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">#{ticket.id?.slice(-8) || 'N/A'}</span>
                      <Badge variant={getStatusBadgeVariant(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        {getStatusLabel(ticket.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{ticket.subject}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline">{ticket.category}</Badge>
                      <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                        {ticket.priority === 'low' ? 'Baixa' : 
                         ticket.priority === 'medium' ? 'Média' : 
                         ticket.priority === 'high' ? 'Alta' : 'Urgente'}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
