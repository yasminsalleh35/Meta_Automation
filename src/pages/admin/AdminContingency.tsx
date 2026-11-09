import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Copy, 
  Eye,
  PlayCircle,
  Image,
  Download,
  Link as LinkIcon,
  Archive,
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useContingencyManualSync } from '@/hooks/useContingencyManualSync';
import { useExternalCampaignSync } from '@/hooks/useExternalCampaignSync';
import { ContingencyCampaignDetails } from '@/components/admin/ContingencyCampaignDetails';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { safeUrl } from '@/lib/safeUrl';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { buildIlikeOrFilter, pageRange, ADMIN_PAGE_SIZE } from '@/lib/postgrestSearch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ContingencyCampaign {
  id: string;
  user_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'auto_retry_success' | 'auto_retry_failed';
  campaign_data: any;
  error_message: string;
  error_stack: string;
  error_stage: string;
  meta_api_trace_id: string | null;
  partial_meta_campaign_id: string | null;
  partial_meta_adset_id: string | null;
  partial_meta_creative_id: string | null;
  partial_meta_ad_id: string | null;
  ad_account_id: string;
  page_id: string;
  instagram_id: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  attempts: number;
  retry_strategy: string | null;
  user_email?: string;
  user_name?: string;
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

// Audit ADM-03: status "finalizados"; o resto conta como pendente/ativo
const DONE_STATUSES = ['completed', 'auto_retry_success'];
const COUNTED_STATUSES = ['pending', 'auto_retry_success', 'auto_retry_failed', 'in_progress', 'completed'] as const;
type ContingencyTab = 'active' | 'completed' | 'all';
type ContingencyCounts = Record<(typeof COUNTED_STATUSES)[number] | 'total', number>;
const EMPTY_COUNTS: ContingencyCounts = { pending: 0, auto_retry_success: 0, auto_retry_failed: 0, in_progress: 0, completed: 0, total: 0 };

// ADM-05: o wizard grava public_url; registros antigos/outros fluxos usam publicUrl
const mediaUrl = (meta: any): string => (meta?.public_url || meta?.publicUrl || '') as string;

const AdminContingency: React.FC = () => {
  const { toast } = useToast();
  const { syncManually, isLoading: isSyncing } = useContingencyManualSync();
  const { syncExternalCampaign, isLoading: isExternalSyncing } = useExternalCampaignSync();
  const [campaigns, setCampaigns] = useState<ContingencyCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<ContingencyCampaign | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [externalSyncDialogOpen, setExternalSyncDialogOpen] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; email: string; name?: string }>>([]);
  // ADM-03: busca de usuário no servidor (antes carregava todos os perfis no select)
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilterState] = useState<ContingencyTab>('active');
  // ADM-03: lista paginada no servidor + contadores por status no servidor
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [counts, setCounts] = useState<ContingencyCounts>(EMPTY_COUNTS);
  const statusFilterRef = useRef<ContingencyTab>('active');
  const pageRef = useRef(0);
  const [syncFormData, setSyncFormData] = useState({
    metaCampaignId: '',
    metaAdsetId: '',
    metaCreativeId: '',
    metaAdId: ''
  });
  const [externalSyncFormData, setExternalSyncFormData] = useState({
    userId: '',
    metaCampaignId: '',
    metaAdsetId: '',
    metaCreativeId: '',
    metaAdId: ''
  });

  // Auto-refresh states
  // ADM-05: ref (não state) — como dependência do useCallback recriava o callback a cada carga,
  // o useEffect abaixo re-executava (nova carga + novos intervals) sempre que a contagem mudava.
  const previousPendingCountRef = useRef<number | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState(REFRESH_INTERVAL_MS / 1000);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Play alert sound using Web Audio API
  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First beep
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      oscillator1.frequency.value = 800;
      oscillator1.type = 'sine';
      gainNode1.gain.value = 0.3;
      oscillator1.start();
      oscillator1.stop(audioContext.currentTime + 0.15);

      // Second beep (higher pitch)
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';
        gainNode2.gain.value = 0.3;
        oscillator2.start();
        oscillator2.stop(audioContext.currentTime + 0.15);
      }, 200);

      // Third beep (highest pitch)
      setTimeout(() => {
        const oscillator3 = audioContext.createOscillator();
        const gainNode3 = audioContext.createGain();
        oscillator3.connect(gainNode3);
        gainNode3.connect(audioContext.destination);
        oscillator3.frequency.value = 1200;
        oscillator3.type = 'sine';
        gainNode3.gain.value = 0.3;
        oscillator3.start();
        oscillator3.stop(audioContext.currentTime + 0.2);
      }, 400);
    } catch (error) {
      console.error('Error playing alert sound:', error);
    }
  }, [soundEnabled]);

  const loadCounts = useCallback(async (): Promise<ContingencyCounts> => {
    const countFor = async (status?: string) => {
      let q = supabase.from('campaign_contingency').select('id', { count: 'exact', head: true });
      if (status) q = q.eq('status', status);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    };
    const values = await Promise.all([...COUNTED_STATUSES.map((st) => countFor(st)), countFor()]);
    const next = { ...EMPTY_COUNTS };
    COUNTED_STATUSES.forEach((st, i) => { next[st] = values[i]; });
    next.total = values[values.length - 1];
    return next;
  }, []);

  const loadContingencyCampaignsWithAlert = useCallback(async (isInitialLoad = false, nextPage: number = pageRef.current) => {
    try {
      setLoading(true);
      const [from, to] = pageRange(nextPage, ADMIN_PAGE_SIZE);
      let query = supabase
        .from('campaign_contingency')
        .select(`
          *,
          profiles!campaign_contingency_user_id_fkey (
            email,
            name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      const tab = statusFilterRef.current;
      if (tab === 'active') {
        query = query.not('status', 'in', `(${DONE_STATUSES.join(',')})`);
      } else if (tab === 'completed') {
        query = query.in('status', DONE_STATUSES);
      }

      const [{ data, error, count }, statusCounts] = await Promise.all([query.range(from, to), loadCounts()]);

      if (error) throw error;

      const enrichedData = (data || []).map(item => ({
        ...item,
        user_email: item.profiles?.email,
        user_name: item.profiles?.name
      }));

      setCampaigns(enrichedData);
      setTotalCount(count ?? 0);
      setPage(nextPage);
      pageRef.current = nextPage;
      setCounts(statusCounts);

      // Count current pending campaigns (contagem do servidor — não só a página carregada)
      const currentPendingCount = statusCounts.total - statusCounts.completed - statusCounts.auto_retry_success;

      // Check for new pending campaigns (only after initial load)
      const previousPendingCount = previousPendingCountRef.current;
      if (!isInitialLoad && previousPendingCount !== null && currentPendingCount > previousPendingCount) {
        const newCount = currentPendingCount - previousPendingCount;
        playAlertSound();
        toast({
          title: `🔔 ${newCount} nova(s) campanha(s) pendente(s)!`,
          description: 'Novas campanhas aguardando atenção',
          variant: 'default',
          duration: 10000,
        });
      }

      previousPendingCountRef.current = currentPendingCount;
      setLastRefreshTime(new Date());
      setNextRefreshIn(REFRESH_INTERVAL_MS / 1000);
    } catch (error) {
      console.error('Error loading contingency campaigns:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar campanhas em contingência',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [playAlertSound, toast, loadCounts]);

  // ADM-03: trocar de aba recarrega no servidor a partir da 1ª página
  const setStatusFilter = (tab: ContingencyTab) => {
    if (tab === statusFilterRef.current) return;
    statusFilterRef.current = tab;
    setStatusFilterState(tab);
    loadContingencyCampaignsWithAlert(false, 0);
  };
  const goToPage = (p: number) => loadContingencyCampaignsWithAlert(false, p);

  // Initial load and auto-refresh setup
  useEffect(() => {
    loadContingencyCampaignsWithAlert(true);

    // Auto-refresh interval (5 minutes)
    const refreshInterval = setInterval(() => {
      loadContingencyCampaignsWithAlert(false);
    }, REFRESH_INTERVAL_MS);

    // Countdown timer (update every second)
    const countdownInterval = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) return REFRESH_INTERVAL_MS / 1000;
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [loadContingencyCampaignsWithAlert]);

  // Keep the original function for manual refresh
  const loadContingencyCampaigns = () => loadContingencyCampaignsWithAlert(false);

  // ADM-03: até 50 usuários por busca (nome/email) em vez de todos os perfis; mantém o selecionado na lista
  const selectedUserIdRef = useRef('');
  selectedUserIdRef.current = externalSyncFormData.userId;
  const loadUsers = useCallback(async (search: string) => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, email, name')
        .order('email', { ascending: true })
        .limit(ADMIN_PAGE_SIZE);
      const searchFilter = buildIlikeOrFilter(['email', 'name'], search);
      if (searchFilter) query = query.or(searchFilter);
      const { data, error } = await query;

      if (error) throw error;
      setUsers(prev => {
        const list = data || [];
        const selected = prev.find(u => u.id === selectedUserIdRef.current);
        return selected && !list.some(u => u.id === selected.id) ? [selected, ...list] : list;
      });
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, []);

  useEffect(() => {
    if (!externalSyncDialogOpen) return;
    const t = setTimeout(() => loadUsers(userSearch), 300);
    return () => clearTimeout(t);
  }, [externalSyncDialogOpen, userSearch, loadUsers]);


  const updateStatus = async (id: string, status: string, notes?: string) => {
    try {
      const updates: any = { status };
      if (notes) updates.admin_notes = notes;
      if (status === 'completed') {
        const { data: { user } } = await supabase.auth.getUser();
        updates.completed_by = user?.id;
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('campaign_contingency')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso'
      });

      loadContingencyCampaigns();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status',
        variant: 'destructive'
      });
    }
  };

  const handleManualSync = async () => {
    if (!selectedCampaign) return;

    const success = await syncManually({
      contingencyId: selectedCampaign.id,
      metaCampaignId: syncFormData.metaCampaignId,
      metaAdsetId: syncFormData.metaAdsetId,
      metaCreativeId: syncFormData.metaCreativeId,
      metaAdId: syncFormData.metaAdId
    });

    if (success) {
      setSyncDialogOpen(false);
      setSyncFormData({
        metaCampaignId: '',
        metaAdsetId: '',
        metaCreativeId: '',
        metaAdId: ''
      });
      loadContingencyCampaigns();
    }
  };

  const archiveCampaign = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('campaign_contingency')
      .update({ 
        status: 'completed',
        completed_by: user?.id,
        completed_at: new Date().toISOString(),
        admin_notes: `Arquivada manualmente em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
      })
      .eq('id', id);

    if (!error) {
      toast({ 
        title: 'Sucesso', 
        description: 'Campanha arquivada com sucesso' 
      });
      loadContingencyCampaigns();
    } else {
      toast({
        title: 'Erro',
        description: 'Falha ao arquivar campanha',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: `${label} copiado para área de transferência`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'auto_retry_success': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      case 'auto_retry_failed': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      case 'in_progress': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'completed': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'failed': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'auto_retry_success':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Criada automaticamente (wa.me)
          </Badge>
        );
      case 'auto_retry_failed':
        return (
          <Badge variant="destructive" className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Falha auto-retry - Necessita criação manual
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando auto-retry
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
            Em progresso
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Finalizada manualmente
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Falha
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'campaign_creation': return '1️⃣';
      case 'adset_creation': return '2️⃣';
      case 'creative_creation': return '3️⃣';
      case 'ad_creation': return '4️⃣';
      default: return '❌';
    }
  };

  // ADM-03: spinner de página inteira só na 1ª carga (troca de aba/página mantém a tela)
  if (loading && campaigns.length === 0 && counts.total === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  // ADM-03: a página já vem filtrada pela aba; contadores vêm do servidor
  const filteredCampaigns = campaigns;
  const activeCount = counts.total - counts.completed - counts.auto_retry_success;
  const completedCount = counts.completed + counts.auto_retry_success;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campanhas em Contingência</h1>
          <p className="text-muted-foreground mt-1">
            Campanhas que falharam e precisam ser criadas manualmente
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Auto-refresh timer */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <RefreshCw className="w-4 h-4" />
            <span>Próximo refresh: {Math.floor(nextRefreshIn / 60)}:{String(nextRefreshIn % 60).padStart(2, '0')}</span>
          </div>
          
          {/* Sound toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Desativar alerta sonoro' : 'Ativar alerta sonoro'}
          >
            {soundEnabled ? (
              <Bell className="w-4 h-4 text-primary" />
            ) : (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>

          <div className="flex gap-2">
            <Button onClick={() => setExternalSyncDialogOpen(true)} variant="default">
              <LinkIcon className="w-4 h-4 mr-2" />
              Sincronizar Campanha Externa
            </Button>
            <Button onClick={loadContingencyCampaigns} variant="outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setStatusFilter('active')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {counts.pending}
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setStatusFilter('completed')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Auto-criadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {counts.auto_retry_success}
            </div>
            <p className="text-xs text-muted-foreground mt-1">via wa.me</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setStatusFilter('active')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Falha Auto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {counts.auto_retry_failed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">necessita manual</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setStatusFilter('active')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {counts.in_progress}
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setStatusFilter('completed')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {counts.completed}
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setStatusFilter('all')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {counts.total}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Filter */}
      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'active' | 'completed' | 'all')}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Pendentes ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Finalizadas ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todas ({counts.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4 mt-6">
          {filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                {statusFilter === 'completed' ? (
                  <>
                    <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Nenhuma campanha finalizada</p>
                    <p className="text-muted-foreground mt-1">Campanhas arquivadas aparecerão aqui</p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium">Nenhuma campanha pendente! 🎉</p>
                    <p className="text-muted-foreground mt-1">Todas as campanhas estão em ordem</p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">
                        {campaign.campaign_data?.campaignName || 'Campanha sem nome'}
                      </CardTitle>
                      {getStatusBadge(campaign.status)}
                      <Badge variant="outline">
                        {getStageIcon(campaign.error_stage)} {campaign.error_stage}
                      </Badge>
                      {campaign.retry_strategy && (
                        <Badge variant="secondary" className="text-xs">
                          {campaign.retry_strategy === 'walink' ? '🔗 wa.me' : campaign.retry_strategy}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Cliente: {campaign.user_name} ({campaign.user_email})
                      <br />
                      Criado: {formatDistanceToNow(new Date(campaign.created_at), { 
                        addSuffix: true,
                        locale: ptBR
                      })}
                      {campaign.status === 'completed' && campaign.completed_at && (
                        <>
                          <br />
                          <span className="text-green-600 dark:text-green-400">
                            Arquivada em: {format(new Date(campaign.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status !== 'completed' && (
                      // ADM-05: arquivar pede confirmação
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                          >
                            <Archive className="w-4 h-4 mr-1" />
                            Arquivar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Arquivar campanha?</AlertDialogTitle>
                            <AlertDialogDescription>
                              A contingência "{campaign.campaign_data?.campaignName || 'Campanha sem nome'}" será marcada como concluída e sairá da fila de pendentes.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => archiveCampaign(campaign.id)}>
                              Arquivar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setAdminNotes(campaign.admin_notes || '');
                        setDetailsOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Ad Account</p>
                    <div className="flex items-center gap-1">
                      <p className="font-mono text-xs">{campaign.ad_account_id}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(campaign.ad_account_id, 'Ad Account ID')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Page ID</p>
                    <div className="flex items-center gap-1">
                      <p className="font-mono text-xs">{campaign.page_id}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(campaign.page_id, 'Page ID')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Orçamento Diário</p>
                    <p className="font-medium">
                      {campaign.campaign_data?.dailyBudget != null ? `R$ ${campaign.campaign_data.dailyBudget}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tentativas</p>
                    <p className="font-medium">{campaign.attempts}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                  <p className="text-sm font-medium text-destructive mb-1">Erro:</p>
                  <p className="text-sm text-destructive/80">{campaign.error_message}</p>
                  {campaign.meta_api_trace_id && (
                    <p className="text-xs text-destructive/60 mt-1 font-mono">
                      Trace ID: {campaign.meta_api_trace_id}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {campaign.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(campaign.id, 'in_progress')}
                    >
                      <PlayCircle className="w-4 h-4 mr-1" />
                      Iniciar Processamento
                    </Button>
                  )}
                  {campaign.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      // ADM-05: notas do próprio card (antes usava as notas do último card aberto)
                      onClick={() => updateStatus(campaign.id, 'completed', campaign.admin_notes || undefined)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Marcar como Concluída
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!campaign.ad_account_id}
                    onClick={() => {
                      // ADM-05: guarda contra ad_account_id nulo
                      if (!campaign.ad_account_id) return;
                      const url = `https://business.facebook.com/adsmanager/manage/campaigns?act=${encodeURIComponent(String(campaign.ad_account_id).replace('act_', ''))}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Abrir Gerenciador
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setSyncDialogOpen(true);
                    }}
                  >
                    <LinkIcon className="w-4 h-4 mr-1" />
                    Sincronizar Manualmente
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))
          )}

          <AdminPagination
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            totalCount={totalCount}
            onPageChange={goToPage}
            disabled={loading}
          />
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Campanha em Contingência</DialogTitle>
            <DialogDescription>
              Todas as informações necessárias para recriar a campanha manualmente
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              {/* Media Section */}
              {selectedCampaign.campaign_data?.selectedMediaMeta && (
                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Mídia da Campanha
                  </h3>
                  <div className="flex gap-4">
                    {/* Preview */}
                    <div className="flex-shrink-0">
                      {String(selectedCampaign.campaign_data.selectedMediaMeta.file_type || '').startsWith('image') ? (
                        <img
                          src={mediaUrl(selectedCampaign.campaign_data.selectedMediaMeta)}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="w-32 h-32 flex items-center justify-center bg-muted rounded-md border">
                          <PlayCircle className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info and Actions */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome do arquivo</p>
                        <p className="font-medium">{selectedCampaign.campaign_data.selectedMediaMeta.filename}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo</p>
                        <Badge variant="outline">{selectedCampaign.campaign_data.selectedMediaMeta.file_type}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(
                            mediaUrl(selectedCampaign.campaign_data.selectedMediaMeta),
                            'URL da mídia'
                          )}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar URL
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(safeUrl(mediaUrl(selectedCampaign.campaign_data.selectedMediaMeta)), '_blank', 'noopener,noreferrer')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Abrir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = safeUrl(mediaUrl(selectedCampaign.campaign_data.selectedMediaMeta));
                            link.download = selectedCampaign.campaign_data.selectedMediaMeta.filename || 'midia';
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Data - Visual Display */}
              <div>
                <h3 className="font-semibold mb-4">Dados da Campanha:</h3>
                <ContingencyCampaignDetails
                  campaignData={selectedCampaign.campaign_data}
                  copyToClipboard={copyToClipboard}
                />
              </div>

              {/* Error Details */}
              <div>
                <h3 className="font-semibold mb-2">Detalhes do Erro:</h3>
                <div className="bg-destructive/5 p-4 rounded-md">
                  <p className="text-sm"><strong>Mensagem:</strong> {selectedCampaign.error_message}</p>
                  {selectedCampaign.error_stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">Stack Trace</summary>
                      <pre className="text-xs mt-2 overflow-x-auto">{selectedCampaign.error_stack}</pre>
                    </details>
                  )}
                </div>
              </div>

              {/* Auto-Retry Success Details */}
              {selectedCampaign.status === 'auto_retry_success' && (
                <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <CardHeader>
                    <CardTitle className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      ✅ Criação Automática via wa.me Link
                    </CardTitle>
                    <CardDescription>
                      Esta campanha foi criada automaticamente usando estratégia wa.me (OUTCOME_TRAFFIC + LINK_CLICKS)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Estratégia</p>
                        <p className="font-medium">{selectedCampaign.retry_strategy || 'walink'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Criada em</p>
                        <p className="font-medium">
                          {selectedCampaign.completed_at 
                            ? formatDistanceToNow(new Date(selectedCampaign.completed_at), { locale: ptBR, addSuffix: true })
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">IDs Criados:</p>
                      <div className="grid gap-2">
                        {selectedCampaign.partial_meta_campaign_id && (
                          <div className="flex items-center justify-between bg-background p-2 rounded">
                            <span className="text-xs">Campaign ID:</span>
                            <code className="text-xs">{selectedCampaign.partial_meta_campaign_id}</code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(selectedCampaign.partial_meta_campaign_id!, 'Campaign ID')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {selectedCampaign.partial_meta_adset_id && (
                          <div className="flex items-center justify-between bg-background p-2 rounded">
                            <span className="text-xs">AdSet ID:</span>
                            <code className="text-xs">{selectedCampaign.partial_meta_adset_id}</code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(selectedCampaign.partial_meta_adset_id!, 'AdSet ID')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {selectedCampaign.partial_meta_ad_id && (
                          <div className="flex items-center justify-between bg-background p-2 rounded">
                            <span className="text-xs">Ad ID:</span>
                            <code className="text-xs">{selectedCampaign.partial_meta_ad_id}</code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(selectedCampaign.partial_meta_ad_id!, 'Ad ID')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const actId = selectedCampaign.ad_account_id.replace('act_', '');
                        const url = `https://business.facebook.com/adsmanager/manage/campaigns?act=${actId}&selected_campaign_ids=${selectedCampaign.partial_meta_campaign_id}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Campanha no Meta Ads Manager
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Auto-Retry Failed Details */}
              {selectedCampaign.status === 'auto_retry_failed' && (
                <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                  <CardHeader>
                    <CardTitle className="text-orange-700 dark:text-orange-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      ⚠️ Falha no Auto-Retry wa.me
                    </CardTitle>
                    <CardDescription>
                      A tentativa automática de criar via wa.me também falhou
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estratégia tentada:</p>
                      <p className="font-medium">{selectedCampaign.retry_strategy || 'walink'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tentativas:</p>
                      <p className="font-medium">{selectedCampaign.attempts}</p>
                    </div>
                    <div className="bg-destructive/10 p-3 rounded">
                      <p className="text-sm font-medium mb-1">Erro do auto-retry:</p>
                      <p className="text-sm">{selectedCampaign.error_message}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm font-medium mb-1">⚠️ Ação necessária:</p>
                      <p className="text-sm">
                        É necessário criar manualmente via Meta Ads Manager ou usar a sincronização manual abaixo.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}


              {/* Partial IDs */}
              {(selectedCampaign.partial_meta_campaign_id || 
                selectedCampaign.partial_meta_adset_id || 
                selectedCampaign.partial_meta_creative_id) && (
                <div>
                  <h3 className="font-semibold mb-2">IDs Parcialmente Criados:</h3>
                  <div className="bg-yellow-500/5 p-4 rounded-md space-y-2">
                    {selectedCampaign.partial_meta_campaign_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Campaign ID:</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          {selectedCampaign.partial_meta_campaign_id}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(
                            selectedCampaign.partial_meta_campaign_id!,
                            'Campaign ID'
                          )}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {selectedCampaign.partial_meta_adset_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Ad Set ID:</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          {selectedCampaign.partial_meta_adset_id}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(
                            selectedCampaign.partial_meta_adset_id!,
                            'Ad Set ID'
                          )}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {selectedCampaign.partial_meta_creative_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Creative ID:</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          {selectedCampaign.partial_meta_creative_id}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(
                            selectedCampaign.partial_meta_creative_id!,
                            'Creative ID'
                          )}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <h3 className="font-semibold mb-2">Notas do Admin:</h3>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione notas sobre o processamento desta campanha..."
                  rows={4}
                />
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    updateStatus(selectedCampaign.id, selectedCampaign.status, adminNotes);
                    setDetailsOpen(false);
                  }}
                >
                  Salvar Notas
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Sync Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sincronizar Campanha Manualmente</DialogTitle>
            <DialogDescription>
              Insira os IDs da campanha criada manualmente no Gerenciador de Anúncios
            </DialogDescription>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">Campanha:</p>
                <p className="text-sm">{selectedCampaign.campaign_data?.campaignName || 'Campanha sem nome'}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Cliente: {selectedCampaign.user_name} ({selectedCampaign.user_email})
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="metaCampaignId">Meta Campaign ID *</Label>
                  <Input
                    id="metaCampaignId"
                    placeholder="Ex: 120235636748000475"
                    value={syncFormData.metaCampaignId}
                    onChange={(e) => setSyncFormData({...syncFormData, metaCampaignId: e.target.value})}
                  />
                  {selectedCampaign.partial_meta_campaign_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ID Parcial já criado: {selectedCampaign.partial_meta_campaign_id}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="metaAdsetId">Meta AdSet ID *</Label>
                  <Input
                    id="metaAdsetId"
                    placeholder="Ex: 120235636748000476"
                    value={syncFormData.metaAdsetId}
                    onChange={(e) => setSyncFormData({...syncFormData, metaAdsetId: e.target.value})}
                  />
                  {selectedCampaign.partial_meta_adset_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ID Parcial já criado: {selectedCampaign.partial_meta_adset_id}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="metaCreativeId">Meta Creative ID (opcional)</Label>
                  <Input
                    id="metaCreativeId"
                    placeholder="Ex: 120235636748000477"
                    value={syncFormData.metaCreativeId}
                    onChange={(e) => setSyncFormData({...syncFormData, metaCreativeId: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="metaAdId">Meta Ad ID *</Label>
                  <Input
                    id="metaAdId"
                    placeholder="Ex: 120235636748000478"
                    value={syncFormData.metaAdId}
                    onChange={(e) => setSyncFormData({...syncFormData, metaAdId: e.target.value})}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleManualSync}
                disabled={!syncFormData.metaCampaignId || !syncFormData.metaAdsetId || !syncFormData.metaAdId || isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sincronizar e Criar Campanha no Camply
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* External Campaign Sync Dialog */}
      <Dialog open={externalSyncDialogOpen} onOpenChange={setExternalSyncDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Sincronizar Campanha Externa
            </DialogTitle>
            <DialogDescription>
              Sincronize uma campanha já criada no Meta Ads para um usuário específico do Camply
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium mb-2">ℹ️ Como funciona:</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Selecione o usuário que receberá a campanha</li>
                <li>Informe os IDs da campanha criada no Meta Ads</li>
                <li>O sistema buscará todas as informações e métricas atualizadas</li>
                <li>A campanha será sincronizada e entrará no fluxo normal de atualização</li>
              </ul>
            </div>

            <div>
              <Label htmlFor="userId">Usuário *</Label>
              <Input
                className="mb-2"
                placeholder="Buscar usuário por nome ou email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <Select
                value={externalSyncFormData.userId}
                onValueChange={(value) => setExternalSyncFormData({...externalSyncFormData, userId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum usuário encontrado</div>
                  )}
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="extCampaignId">Meta Campaign ID *</Label>
              <Input
                id="extCampaignId"
                placeholder="Ex: 120235636748000475"
                value={externalSyncFormData.metaCampaignId}
                onChange={(e) => setExternalSyncFormData({...externalSyncFormData, metaCampaignId: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="extAdsetId">Meta AdSet ID *</Label>
              <Input
                id="extAdsetId"
                placeholder="Ex: 120235636748000476"
                value={externalSyncFormData.metaAdsetId}
                onChange={(e) => setExternalSyncFormData({...externalSyncFormData, metaAdsetId: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="extCreativeId">Meta Creative ID (opcional)</Label>
              <Input
                id="extCreativeId"
                placeholder="Ex: 120235636748000477"
                value={externalSyncFormData.metaCreativeId}
                onChange={(e) => setExternalSyncFormData({...externalSyncFormData, metaCreativeId: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="extAdId">Meta Ad ID *</Label>
              <Input
                id="extAdId"
                placeholder="Ex: 120235636748000478"
                value={externalSyncFormData.metaAdId}
                onChange={(e) => setExternalSyncFormData({...externalSyncFormData, metaAdId: e.target.value})}
              />
            </div>

            <Button
              className="w-full"
              onClick={async () => {
                const success = await syncExternalCampaign(externalSyncFormData);
                if (success) {
                  setExternalSyncDialogOpen(false);
                  setExternalSyncFormData({
                    userId: '',
                    metaCampaignId: '',
                    metaAdsetId: '',
                    metaCreativeId: '',
                    metaAdId: ''
                  });
                }
              }}
              disabled={
                !externalSyncFormData.userId || 
                !externalSyncFormData.metaCampaignId || 
                !externalSyncFormData.metaAdsetId || 
                !externalSyncFormData.metaAdId || 
                isExternalSyncing
              }
            >
              {isExternalSyncing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Sincronizar Campanha
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminContingency;
