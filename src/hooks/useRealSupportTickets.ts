
import { useState, useEffect } from 'react';
import { useSupabase } from './useSupabase';
import { useToast } from './use-toast';

export interface SupportTicket {
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
  responses?: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export const useRealSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase();
  const { toast } = useToast();

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          responses:ticket_responses(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: status as any } : ticket
      ));

      toast({
        title: "Sucesso",
        description: "Status do ticket atualizado"
      });
    } catch (err) {
      console.error('Error updating ticket:', err);
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
        .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, assigned_to: assignedTo } : ticket
      ));

      toast({
        title: "Sucesso",
        description: "Ticket atribuído com sucesso"
      });
    } catch (err) {
      console.error('Error assigning ticket:', err);
      toast({
        title: "Erro",
        description: "Erro ao atribuir ticket",
        variant: "destructive"
      });
    }
  };

  const addResponse = async (ticketId: string, message: string, isInternal: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('ticket_responses')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message,
          is_internal: isInternal
        });

      if (error) throw error;

      // Reload tickets to get updated responses
      await loadTickets();

      toast({
        title: "Sucesso",
        description: "Resposta adicionada"
      });
    } catch (err) {
      console.error('Error adding response:', err);
      toast({
        title: "Erro",
        description: "Erro ao adicionar resposta",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  return {
    tickets,
    isLoading,
    error,
    loadTickets,
    updateTicketStatus,
    assignTicket,
    addResponse
  };
};
