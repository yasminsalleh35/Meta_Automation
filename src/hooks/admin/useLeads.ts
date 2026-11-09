import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import {
  buildIlikeOrFilter,
  pageRange,
  quotePostgrestValue,
  ADMIN_PAGE_SIZE,
  EXPORT_CHUNK_SIZE,
} from '@/lib/postgrestSearch';

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

export interface LeadFilterOptions {
  specialties: string[];
  utmSources: string[];
}

// Mesmas colunas que get_leads_admin_safe() devolvia (sem user_id / prev_monthly_spend).
const LEAD_COLUMNS = [
  'id', 'name', 'clinic_name', 'specialty', 'specialties', 'city', 'state', 'whatsapp_e164', 'email',
  'used_paid_traffic', 'platforms', 'desired_monthly_spend_range', 'main_goal', 'start_timing',
  'expectations', 'instagram', 'website', 'best_contact_time', 'preferred_channel', 'notes',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'referrer', 'page_path',
  'device', 'status', 'tags', 'owner_id', 'comments', 'answers', 'created_at', 'updated_at',
].join(',');

const emptyMetrics = { total: 0, newLeads: 0, contacted: 0, qualified: 0, closed: 0, conversionRate: '0.0' };

// Audit ADM-03: a lista vinha inteira de get_leads_admin_safe() (corte de 1.000 linhas do PostgREST) e
// era filtrada/contada no navegador. Agora: filtros, paginação (50/página) e métricas no servidor
// (policy "admins can view all" em leads); o CSV percorre todos os resultados em lotes de 1.000.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyLeadFilters = (query: any, filters: LeadsFilters, opts: { skipStatus?: boolean } = {}) => {
  let q = query;
  const search = buildIlikeOrFilter(['name', 'email', 'clinic_name'], filters.search);
  if (search) q = q.or(search);
  if (!opts.skipStatus && filters.status) q = q.eq('status', filters.status);
  // ADM-05: leads antigos só têm `specialty` (texto); os novos, `specialties` (array)
  if (filters.specialty && filters.specialty !== 'all') {
    const v = filters.specialty;
    q = q.or(`specialty.ilike.${quotePostgrestValue(v)},specialties.cs.{${quotePostgrestValue(v)}}`);
  }
  if (filters.utmSource) q = q.eq('utm_source', filters.utmSource);
  if (filters.owner) q = q.eq('owner_id', filters.owner);
  if (filters.dateRange?.start) q = q.gte('created_at', filters.dateRange.start);
  if (filters.dateRange?.end) q = q.lte('created_at', filters.dateRange.end);
  return q;
};

export const useLeads = (pageSize: number = ADMIN_PAGE_SIZE) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFiltersState] = useState<LeadsFilters>({});
  const [filterOptions, setFilterOptions] = useState<LeadFilterOptions>({ specialties: [], utmSources: [] });
  const [metrics, setMetrics] = useState(emptyMetrics);
  const supabase = useSupabase();
  const { toast } = useToast();
  const filtersRef = useRef<LeadsFilters>({});
  const pageRef = useRef(0);
  const requestRef = useRef(0);

  const countLeads = useCallback(async (f: LeadsFilters, status?: string | 'novo_or_null') => {
    let q = applyLeadFilters(
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      f,
      { skipStatus: status !== undefined },
    );
    if (status === 'novo_or_null') q = q.or('status.eq.novo,status.is.null');
    else if (status) q = q.eq('status', status);
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  }, [supabase]);

  const loadMetrics = useCallback(async (f: LeadsFilters) => {
    try {
      // mesmas regras de antes, mas contadas no servidor: status filtrado restringe todos os cards
      const statusOf = (s: string | 'novo_or_null') =>
        f.status
          ? (s === 'novo_or_null' ? (f.status === 'novo' ? countLeads(f) : Promise.resolve(0)) : (f.status === s ? countLeads(f) : Promise.resolve(0)))
          : countLeads(f, s);
      const [total, newLeads, contacted, qualified, closed] = await Promise.all([
        countLeads(f),
        statusOf('novo_or_null'),
        statusOf('contatado'),
        statusOf('qualificado'),
        statusOf('fechado'),
      ]);
      const conversionRate = total > 0 ? ((qualified + closed) / total * 100) : 0;
      setMetrics({ total, newLeads, contacted, qualified, closed, conversionRate: conversionRate.toFixed(1) });
    } catch (error) {
      console.error('Error loading lead metrics:', error);
    }
  }, [countLeads]);

  const fetchLeads = useCallback(async (nextPage: number = pageRef.current) => {
    const f = filtersRef.current;
    const requestId = ++requestRef.current;
    try {
      setLoading(true);
      const [from, to] = pageRange(nextPage, pageSize);
      const query = applyLeadFilters(
        supabase.from('leads').select(LEAD_COLUMNS, { count: 'exact' }),
        f,
      ).order('created_at', { ascending: false });
      const { data, error, count } = await query.range(from, to);

      if (requestId !== requestRef.current) return;
      if (error) {
        console.error('Error fetching leads:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar leads',
          variant: 'destructive',
        });
        return;
      }

      setLeads((data || []) as Lead[]);
      setTotalCount(count ?? 0);
      setPage(nextPage);
      pageRef.current = nextPage;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao carregar leads',
        variant: 'destructive',
      });
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [supabase, pageSize, toast]);

  // Opções dos filtros (todas as especialidades/origens, não só as da página) — só 3 colunas, em lotes
  const loadFilterOptions = useCallback(async () => {
    try {
      const specialties = new Set<string>();
      const utmSources = new Set<string>();
      for (let from = 0; ; from += EXPORT_CHUNK_SIZE) {
        const { data, error } = await supabase
          .from('leads')
          .select('id, specialty, specialties, utm_source')
          .order('id')
          .range(from, from + EXPORT_CHUNK_SIZE - 1);
        if (error) throw error;
        (data || []).forEach((lead: any) => {
          [...(Array.isArray(lead.specialties) ? lead.specialties : []), ...(lead.specialty ? [lead.specialty] : [])]
            .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
            .forEach((s) => specialties.add(s));
          if (lead.utm_source) utmSources.add(lead.utm_source);
        });
        if (!data || data.length < EXPORT_CHUNK_SIZE) break;
      }
      setFilterOptions({ specialties: Array.from(specialties).sort(), utmSources: Array.from(utmSources).sort() });
    } catch (error) {
      console.error('Error loading lead filter options:', error);
    }
  }, [supabase]);

  /** Todos os leads que casam com os filtros atuais (para o CSV), em lotes de 1.000. */
  const fetchAllFilteredLeads = useCallback(async (): Promise<Lead[]> => {
    const f = filtersRef.current;
    const all: Lead[] = [];
    for (let from = 0; ; from += EXPORT_CHUNK_SIZE) {
      const { data, error } = await applyLeadFilters(supabase.from('leads').select(LEAD_COLUMNS), f)
        .order('created_at', { ascending: false })
        .order('id')
        .range(from, from + EXPORT_CHUNK_SIZE - 1);
      if (error) throw error;
      all.push(...((data || []) as Lead[]));
      if (!data || data.length < EXPORT_CHUNK_SIZE) break;
    }
    return all;
  }, [supabase]);

  const refreshLeads = useCallback(async () => {
    await Promise.all([fetchLeads(pageRef.current), loadMetrics(filtersRef.current)]);
  }, [fetchLeads, loadMetrics]);

  const setFilters = useCallback((next: LeadsFilters) => {
    setFiltersState(next);
  }, []);

  // filtros aplicados no servidor (busca com debounce); volta para a 1ª página
  useEffect(() => {
    const t = setTimeout(() => {
      filtersRef.current = filters;
      fetchLeads(0);
      loadMetrics(filters);
    }, 300);
    return () => clearTimeout(t);
  }, [filters, fetchLeads, loadMetrics]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

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

      await refreshLeads();
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

      await fetchLeads(pageRef.current);
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

  return {
    // página atual (já filtrada no servidor)
    leads,
    totalCount,
    page,
    pageSize,
    goToPage: (p: number) => fetchLeads(p),
    // ADM-05/ADM-03: opções dos filtros vêm de todos os leads, não só da página
    filterOptions,
    loading,
    filters,
    setFilters,
    updateLead,
    addComment,
    refreshLeads,
    fetchAllFilteredLeads,
    metrics,
  };
};
