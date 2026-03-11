import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdvantageCampaignCreation } from '@/hooks/useAdvantageCampaignCreation';
import { Sparkles, Target, Zap } from 'lucide-react';

const AdvantageCampaignDemo: React.FC = () => {
  const { createAdvantageCampaign, isLoading } = useAdvantageCampaignCreation();
  
  const [formData, setFormData] = useState({
    name: 'Campanha Camply',
    daily_budget: 50,
    start_time: new Date().toISOString(),
    location: {
      city: 'São Paulo, SP, Brasil',
      radius: 15
    },
    fanpage_id: '',
    instagram_actor_id: '',
    media: {
      type: 'image' as 'image' | 'video',
      hash_or_id: ''
    },
    title: 'Fale Conosco no WhatsApp',
    copy: 'Entre em contato conosco agora mesmo! Clique e tire suas dúvidas.',
    whatsapp_number: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAdvantageCampaign(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        const parentValue = prev[parent as keyof typeof prev];
        if (typeof parentValue === 'object' && parentValue !== null) {
          return {
            ...prev,
            [parent]: {
              ...parentValue,
              [child]: value
            }
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <CardTitle className="text-2xl text-purple-800">
              Meta Ads Advantage+ Campaign
            </CardTitle>
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <CardDescription className="text-lg">
            Targeting automático otimizado pela IA da Meta para máximo desempenho
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold">Targeting Automático</h3>
            <p className="text-sm text-gray-600">Sem segmentação manual - Meta otimiza automaticamente</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold">Performance Otimizada</h3>
            <p className="text-sm text-gray-600">IA encontra as melhores audiências automaticamente</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <Sparkles className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold">Configuração Simples</h3>
            <p className="text-sm text-gray-600">Apenas localização, orçamento e criativos</p>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Campanha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Campanha</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nome da sua campanha"
                />
              </div>
              
              <div>
                <Label htmlFor="daily_budget">Orçamento Diário (R$)</Label>
                <Input
                  id="daily_budget"
                  type="number"
                  value={formData.daily_budget}
                  onChange={(e) => handleInputChange('daily_budget', Number(e.target.value))}
                  placeholder="50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.location.city}
                  onChange={(e) => handleInputChange('location.city', e.target.value)}
                  placeholder="São Paulo, SP, Brasil"
                />
              </div>
              
              <div>
                <Label htmlFor="radius">Raio (km)</Label>
                <Input
                  id="radius"
                  type="number"
                  value={formData.location.radius}
                  onChange={(e) => handleInputChange('location.radius', Number(e.target.value))}
                  placeholder="15"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações Meta Ads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fanpage_id">ID da Fanpage</Label>
                <Input
                  id="fanpage_id"
                  value={formData.fanpage_id}
                  onChange={(e) => handleInputChange('fanpage_id', e.target.value)}
                  placeholder="ID da sua página do Facebook"
                />
              </div>
              
              <div>
                <Label htmlFor="instagram_actor_id">ID da Conta Instagram</Label>
                <Input
                  id="instagram_actor_id"
                  value={formData.instagram_actor_id}
                  onChange={(e) => handleInputChange('instagram_actor_id', e.target.value)}
                  placeholder="ID da sua conta do Instagram"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="media_type">Tipo de Mídia</Label>
                <Select onValueChange={(value) => handleInputChange('media.type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="media_hash">Hash/ID da Mídia</Label>
                <Input
                  id="media_hash"
                  value={formData.media.hash_or_id}
                  onChange={(e) => handleInputChange('media.hash_or_id', e.target.value)}
                  placeholder="Hash da imagem ou ID do vídeo"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conteúdo do Anúncio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Anúncio</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Título chamativo para seu anúncio"
              />
            </div>
            
            <div>
              <Label htmlFor="copy">Texto do Anúncio</Label>
              <Textarea
                id="copy"
                value={formData.copy}
                onChange={(e) => handleInputChange('copy', e.target.value)}
                placeholder="Escreva uma mensagem persuasiva..."
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="whatsapp_number">Número do WhatsApp</Label>
              <Input
                id="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                placeholder="5511999999999"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          size="lg"
        >
          {isLoading ? 'Criando Campanha Advantage+...' : 'Criar Campanha Advantage+ 🚀'}
        </Button>
      </form>
    </div>
  );
};

export default AdvantageCampaignDemo;
