import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export const useSupportTickets = () => {
  const { toast } = useToast();
  const supabase = useSupabase();
  const { createNotification } = useNotifications();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [responses, setResponses] = useState<{ [ticketId: string]: TicketResponse[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserTickets();
    
    // Configurar realtime para tickets
    const ticketsChannel = supabase
      .channel('support-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        () => {
          loadUserTickets();
        }
      )
      .subscribe();

    // Configurar realtime para respostas
    const responsesChannel = supabase
      .channel('ticket-responses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_responses'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newResponse = payload.new as TicketResponse;
            loadTicketResponses(newResponse.ticket_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(responsesChannel);
    };
  }, []);

  const loadUserTickets = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion para garantir que os dados estão no formato correto
      const typedTickets = (data || []) as SupportTicket[];
      setTickets(typedTickets);
    } catch (error) {
      console.error('Error loading support tickets:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tickets de suporte",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTicketResponses = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Type assertion para garantir que os dados estão no formato correto
      const typedResponses = (data || []) as TicketResponse[];
      setResponses(prev => ({ ...prev, [ticketId]: typedResponses }));
    } catch (error) {
      console.error('Error loading ticket responses:', error);
    }
  };

  const createTicket = async (subject: string, description: string, priority: string = 'medium', category: string = 'general') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject,
          description,
          priority,
          category,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      // Criar notificação para admins
      await createNotification(
        'Novo Ticket de Suporte',
        `Novo ticket criado: ${subject}`,
        'info'
      );

      toast({
        title: "Sucesso",
        description: "Ticket de suporte criado com sucesso"
      });

      return data as SupportTicket;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar ticket de suporte",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status do ticket atualizado com sucesso"
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do ticket",
        variant: "destructive"
      });
    }
  };

  const assignTicket = async (ticketId: string, assignedTo: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: assignedTo })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ticket atribuído com sucesso"
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: "Erro",
        description: "Erro ao atribuir ticket",
        variant: "destructive"
      });
    }
  };

  const respondToTicket = async (ticketId: string, message: string, isInternal: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('ticket_responses')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message,
          is_internal: isInternal
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar status do ticket para 'in_progress' se estiver 'open'
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket?.status === 'open') {
        await updateTicketStatus(ticketId, 'in_progress');
      }

      toast({
        title: "Sucesso",
        description: "Resposta enviada com sucesso"
      });

      return data as TicketResponse;
    } catch (error) {
      console.error('Error responding to ticket:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar resposta",
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    tickets,
    responses,
    isLoading,
    createTicket,
    updateTicketStatus,
    assignTicket,
    respondToTicket,
    loadTicketResponses,
    refreshTickets: loadUserTickets
  };
};
