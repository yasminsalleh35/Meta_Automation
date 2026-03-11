import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  Users, 
  Image as ImageIcon,
  Link as LinkIcon,
  Facebook,
  Instagram,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Location {
  key: string;
  name: string;
  type: 'country' | 'region' | 'city' | 'zip';
  country_code?: string;
  region?: string;
  radius?: number;
  distance_unit?: 'kilometer' | 'mile';
}

interface ContingencyCampaignDetailsProps {
  campaignData: any;
  copyToClipboard: (text: string, label: string) => void;
}

export const ContingencyCampaignDetails: React.FC<ContingencyCampaignDetailsProps> = ({
  campaignData,
  copyToClipboard
}) => {
  const [showRawJson, setShowRawJson] = useState(false);

  const formatGender = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'all': return 'Todos';
      case 'male': return 'Masculino';
      case 'female': return 'Feminino';
      default: return gender || 'Não especificado';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não especificado';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getLocationType = (type: string) => {
    switch (type) {
      case 'country': return '🌍 País';
      case 'region': return '🏙️ Região';
      case 'city': return '🏙️ Cidade';
      case 'zip': return '📮 CEP';
      default: return type;
    }
  };

  const locations: Location[] = campaignData.selected_locations || [];
  const hasLocations = locations && locations.length > 0;

  const copyAllLocationKeys = () => {
    const keys = locations.map(loc => loc.key).join(', ');
    copyToClipboard(keys, 'Keys das localizações');
  };

  const copyAllLocationNames = () => {
    const names = locations.map(loc => loc.name).join(', ');
    copyToClipboard(names, 'Nomes das localizações');
  };

  const extractWhatsAppNumber = (link: string) => {
    if (!link) return '';
    const match = link.match(/wa\.me\/(\d+)/);
    return match ? match[1] : '';
  };

  return (
    <div className="space-y-6">
      {/* Quick Copy Section */}
      <Card className="bg-accent/5">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            📋 Cópia Rápida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(campaignData.campaignName || '', 'Nome da campanha')}
            >
              Nome da Campanha
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(campaignData.adTitle || '', 'Título do anúncio')}
            >
              Título do Anúncio
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(campaignData.adText || '', 'Texto do anúncio')}
            >
              Texto do Anúncio
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(campaignData.whatsappLink || '', 'Link WhatsApp')}
            >
              Link WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Media Preview */}
        {campaignData.selectedMediaMeta?.publicUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Mídia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={campaignData.selectedMediaMeta.publicUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => copyToClipboard(campaignData.selectedMediaMeta.publicUrl, 'URL da mídia')}
                >
                  <LinkIcon className="w-3 h-3 mr-1" />
                  Copiar URL
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <a
                    href={campaignData.selectedMediaMeta.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Abrir
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              📝 Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Nome da Campanha</p>
                  <p className="font-medium text-sm break-words">{campaignData.campaignName}</p>
                </div>
                <CopyButton text={campaignData.campaignName || ''} />
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Objetivo</p>
                  <Badge variant="secondary">{campaignData.objective}</Badge>
                </div>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Orçamento Diário</p>
                  <p className="font-medium text-sm">{formatCurrency(parseFloat(campaignData.dailyBudget || 0))}</p>
                </div>
                <CopyButton text={campaignData.dailyBudget?.toString() || ''} />
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Data de Início</p>
                  <p className="text-sm">{formatDate(campaignData.startDate)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Creative Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            🎨 Criativo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Título do Anúncio</p>
              <p className="font-medium break-words">{campaignData.adTitle}</p>
            </div>
            <CopyButton text={campaignData.adTitle || ''} />
          </div>

          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Texto do Anúncio</p>
              <p className="text-sm break-words whitespace-pre-wrap">{campaignData.adText}</p>
            </div>
            <CopyButton text={campaignData.adText || ''} />
          </div>
        </CardContent>
      </Card>

      {/* Locations Section */}
      {hasLocations && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Localizações ({locations.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyAllLocationKeys}
                >
                  Copiar Keys
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyAllLocationNames}
                >
                  Copiar Nomes
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {locations.map((location, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <Badge variant="outline" className="mb-2">
                            {getLocationType(location.type)}
                          </Badge>
                          <p className="font-medium text-sm break-words">{location.name}</p>
                          {location.region && (
                            <p className="text-xs text-muted-foreground">{location.region}</p>
                          )}
                          {location.country_code && (
                            <p className="text-xs text-muted-foreground">País: {location.country_code}</p>
                          )}
                          {location.radius && (
                            <p className="text-xs text-muted-foreground">
                              Raio: {location.radius} {location.distance_unit === 'mile' ? 'milhas' : 'km'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground font-mono flex-1 truncate">
                          Key: {location.key}
                        </p>
                        <CopyButton text={location.key} className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Audience and Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Audience */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Público-Alvo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gênero</p>
              <p className="font-medium">{formatGender(campaignData.gender)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Faixa Etária</p>
              <p className="font-medium">
                {campaignData.ageMin || 18} - {campaignData.ageMax || 65} anos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Destination and Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Destino e Contas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaignData.whatsappLink && (
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    Link WhatsApp
                  </p>
                  <p className="text-sm font-mono break-all">{campaignData.whatsappLink}</p>
                  {extractWhatsAppNumber(campaignData.whatsappLink) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Número: {extractWhatsAppNumber(campaignData.whatsappLink)}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <CopyButton text={campaignData.whatsappLink} />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    asChild
                  >
                    <a
                      href={campaignData.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {campaignData.fanpage && (
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Facebook className="w-3 h-3" />
                    Fanpage ID
                  </p>
                  <p className="text-sm font-mono">{campaignData.fanpage}</p>
                </div>
                <CopyButton text={campaignData.fanpage} />
              </div>
            )}

            {campaignData.instagram && (
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Instagram className="w-3 h-3" />
                    Instagram ID
                  </p>
                  <p className="text-sm font-mono">{campaignData.instagram}</p>
                </div>
                <CopyButton text={campaignData.instagram} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Raw JSON (Collapsible) */}
      <Collapsible open={showRawJson} onOpenChange={setShowRawJson}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <CardTitle className="text-sm flex items-center gap-2">
                  🔧 Dados Técnicos (JSON Raw)
                </CardTitle>
                {showRawJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => copyToClipboard(JSON.stringify(campaignData, null, 2), 'JSON completo')}
                >
                  Copiar JSON
                </Button>
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-xs">
                  {JSON.stringify(campaignData, null, 2)}
                </pre>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
