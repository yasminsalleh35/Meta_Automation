import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

export interface Lead {
  id: string;
  name: string | null;
  clinic_name: string | null;
  specialty: string | null;
  specialties: string[] | null;
  city: string | null;
  state: string | null;
  whatsapp_e164: string | null;
  email: string | null;
  used_paid_traffic: string | null;
  platforms: string[] | null;
  desired_monthly_spend_range: string | null;
  main_goal: string | null;
  start_timing: string | null;
  expectations: string | null;
  instagram: string | null;
  website: string | null;
  best_contact_time: string | null;
  preferred_channel: string | null;
  notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
  page_path: string | null;
  device: string | null;
  status: string | null;
  tags: string[] | null;
  owner_id: string | null;
  comments: any[] | null;
  answers: any;
  created_at: string;
  updated_at: string;
}

export interface LeadsFilters {
  status?: string;
  dateRange?: { start: string; end: string };
  search?: string;
  specialty?: string;
  utmSource?: string;
  owner?: string;
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadsFilters>({});
  const supabase = useSupabase();
  const { toast } = useToast();

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_leads_admin_safe');
      
      if (error) {
        console.error('Error fetching leads:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar leads',
          variant: 'destructive',
        });
        return;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao carregar leads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async (leadId: string, updates: {
    status?: string;
    notes?: string;
    tags?: string[];
    owner_id?: string;
  }) => {
    try {
      const { data, error } = await supabase.rpc('update_lead_admin_safe', {
        p_lead_id: leadId,
        p_status: updates.status,
        p_notes: updates.notes,
        p_tags: updates.tags,
        p_owner_id: updates.owner_id,
      });

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar lead',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sucesso',
        description: 'Lead atualizado com sucesso',
      });

      await fetchLeads();
      return true;
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao atualizar lead',
        variant: 'destructive',
      });
      return false;
    }
  };

  const addComment = async (leadId: string, comment: string) => {
    try {
      const { data, error } = await supabase.rpc('add_lead_comment_admin_safe', {
        p_lead_id: leadId,
        p_comment: comment,
      });

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao adicionar comentário',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sucesso',
        description: 'Comentário adicionado com sucesso',
      });

      await fetchLeads();
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao adicionar comentário',
        variant: 'destructive',
      });
      return false;
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = 
        lead.name?.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search) ||
        lead.clinic_name?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    if (filters.status && lead.status !== filters.status) {
      return false;
    }

    if (filters.specialty && !lead.specialties?.includes(filters.specialty)) {
      return false;
    }

    if (filters.utmSource && lead.utm_source !== filters.utmSource) {
      return false;
    }

    if (filters.owner && lead.owner_id !== filters.owner) {
      return false;
    }

    return true;
  });

  const getMetrics = () => {
    const total = filteredLeads.length;
    const newLeads = filteredLeads.filter(lead => lead.status === 'novo' || !lead.status).length;
    const contacted = filteredLeads.filter(lead => lead.status === 'contatado').length;
    const qualified = filteredLeads.filter(lead => lead.status === 'qualificado').length;
    const closed = filteredLeads.filter(lead => lead.status === 'fechado').length;
    
    const conversionRate = total > 0 ? ((qualified + closed) / total * 100) : 0;

    return {
      total,
      newLeads,
      contacted,
      qualified,
      closed,
      conversionRate: conversionRate.toFixed(1),
    };
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return {
    leads: filteredLeads,
    loading,
    filters,
    setFilters,
    updateLead,
    addComment,
    refreshLeads: fetchLeads,
    metrics: getMetrics(),
  };
};