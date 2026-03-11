import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  Mail, 
  MapPin, 
  DollarSign, 
  Clock,
  User,
  Building,
  Target,
  Smartphone,
  Globe,
  Instagram,
  Calendar,
  Send,
  Tag,
  FileText
} from 'lucide-react';
import { Lead } from '@/hooks/admin/useLeads';
import { useToast } from '@/hooks/use-toast';

interface LeadDrawerProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onLeadUpdate: (leadId: string, updates: any) => Promise<boolean>;
  onAddComment: (leadId: string, comment: string) => Promise<boolean>;
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({
  lead,
  open,
  onClose,
  onLeadUpdate,
  onAddComment
}) => {
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const { toast } = useToast();

  if (!lead) return null;

  const statusOptions = [
    { value: 'novo', label: 'Novo', color: 'bg-blue-100 text-blue-800' },
    { value: 'contatado', label: 'Contatado', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'qualificado', label: 'Qualificado', color: 'bg-green-100 text-green-800' },
    { value: 'fechado', label: 'Fechado', color: 'bg-green-100 text-green-800' },
    { value: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-800' },
  ];

  const handleStatusChange = async (newStatus: string) => {
    await onLeadUpdate(lead.id, { status: newStatus });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    const success = await onAddComment(lead.id, newComment.trim());
    if (success) {
      setNewComment('');
    }
    setIsAddingComment(false);
  };

  const openWhatsApp = () => {
    if (lead.whatsapp_e164) {
      const cleanNumber = lead.whatsapp_e164.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
  };

  const openInstagram = () => {
    if (lead.instagram) {
      const cleanHandle = lead.instagram.replace('@', '');
      window.open(`https://instagram.com/${cleanHandle}`, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentStatus = statusOptions.find(s => s.value === (lead.status || 'novo'));

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">
              {lead.name || 'Lead sem nome'}
            </SheetTitle>
            <Badge className={currentStatus?.color}>
              {currentStatus?.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openWhatsApp}
              disabled={!lead.whatsapp_e164}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => lead.email && window.open(`mailto:${lead.email}`)}
              disabled={!lead.email}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status do Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={lead.status || 'novo'} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <p className="font-medium">{lead.name || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{lead.email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">WhatsApp:</span>
                  <p className="font-medium">{lead.whatsapp_e164 || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Clínica:</span>
                  <p className="font-medium">{lead.clinic_name || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Especialidades */}
          {(lead.specialties?.length || lead.specialty) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Especialidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lead.specialties?.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  )) || (
                    lead.specialty && (
                      <Badge variant="secondary">{lead.specialty}</Badge>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Localização */}
          {(lead.city || lead.state) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{[lead.city, lead.state].filter(Boolean).join(', ')}</p>
              </CardContent>
            </Card>
          )}

          {/* Investimento e Objetivos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Investimento e Objetivos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.desired_monthly_spend_range && (
                <div>
                  <span className="text-muted-foreground text-sm">Investimento mensal desejado:</span>
                  <p className="font-medium">{lead.desired_monthly_spend_range}</p>
                </div>
              )}
              {lead.main_goal && (
                <div>
                  <span className="text-muted-foreground text-sm">Objetivo principal:</span>
                  <p className="font-medium">{lead.main_goal}</p>
                </div>
              )}
              {lead.start_timing && (
                <div>
                  <span className="text-muted-foreground text-sm">Urgência:</span>
                  <p className="font-medium">{lead.start_timing}</p>
                </div>
              )}
              {lead.expectations && (
                <div>
                  <span className="text-muted-foreground text-sm">Expectativas:</span>
                  <p className="font-medium">{lead.expectations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Marketing Digital */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Experiência com Marketing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-muted-foreground text-sm">Já investiu em tráfego pago:</span>
                <p className="font-medium">{lead.used_paid_traffic || '-'}</p>
              </div>
              {lead.platforms?.length && (
                <div>
                  <span className="text-muted-foreground text-sm">Plataformas utilizadas:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {lead.platforms.map((platform, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contato e Redes Sociais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Contato e Redes Sociais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.best_contact_time && (
                <div>
                  <span className="text-muted-foreground text-sm">Melhor horário:</span>
                  <p className="font-medium">{lead.best_contact_time}</p>
                </div>
              )}
              {lead.preferred_channel && (
                <div>
                  <span className="text-muted-foreground text-sm">Canal preferido:</span>
                  <p className="font-medium">{lead.preferred_channel}</p>
                </div>
              )}
              <div className="flex gap-2">
                {lead.instagram && (
                  <Button variant="outline" size="sm" onClick={openInstagram} className="gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Button>
                )}
                {lead.website && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(lead.website!, '_blank')}
                    className="gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* UTM e Origem */}
          {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Origem do Lead
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {lead.utm_source && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fonte:</span>
                    <span>{lead.utm_source}</span>
                  </div>
                )}
                {lead.utm_medium && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mídia:</span>
                    <span>{lead.utm_medium}</span>
                  </div>
                )}
                {lead.utm_campaign && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Campanha:</span>
                    <span>{lead.utm_campaign}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comentários */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Comentários Internos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.comments && lead.comments.length > 0 ? (
                <div className="space-y-3">
                  {lead.comments.map((comment: any, index: number) => (
                    <div key={index} className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{comment.author_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum comentário ainda</p>
              )}

              <Separator />

              <div className="space-y-2">
                <Textarea
                  placeholder="Adicionar comentário interno..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isAddingComment}
                  className="w-full gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isAddingComment ? 'Adicionando...' : 'Adicionar Comentário'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em:</span>
                <span>{formatDate(lead.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atualizado em:</span>
                <span>{formatDate(lead.updated_at)}</span>
              </div>
              {lead.device && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dispositivo:</span>
                  <span>{lead.device}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};