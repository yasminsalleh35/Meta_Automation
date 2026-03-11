
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SimpleCampaignFormData } from '@/types/simpleCampaign.types';
import { useAISuggestions } from '@/hooks/useAISuggestions';
import { useToast } from '@/hooks/use-toast';
import { useAILoadingProgress } from '@/hooks/useAILoadingProgress';

interface Step1InfoProps {
  formData: SimpleCampaignFormData;
  updateFormData: (field: keyof SimpleCampaignFormData, value: any) => void;
}

export const Step1Info: React.FC<Step1InfoProps> = ({ formData, updateFormData }) => {
  const { toast } = useToast();
  const {
    isAILoading,
    handleAISuggestion
  } = useAISuggestions();
  
  const { progress, currentStage, isInFinalStage } = useAILoadingProgress(isAILoading);

  const onClickCamplyIA = async () => {
    try {
      await handleAISuggestion("gerar leads via WhatsApp", (suggestions) => {
        if (suggestions) {
          // Usar adTitle diretamente da IA
          if (suggestions.adTitle) {
            updateFormData('adTitle', suggestions.adTitle);
          }
          
          if (suggestions.adText) {
            updateFormData('adText', suggestions.adText);
          }
          
          toast({
            title: "Sugestões aplicadas com sucesso!",
            description: "Título e texto do anúncio foram gerados pela Camply IA.",
          });
        } else {
          toast({
            title: "Erro ao gerar sugestões",
            description: "Não foi possível gerar as sugestões. Tente novamente.",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      toast({
        title: "Erro ao gerar sugestões",
        description: "Não foi possível conectar com a Camply IA. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Informações Gerais</CardTitle>
        <CardDescription className="text-center">
          Defina o nome e o conteúdo da sua campanha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="campaignName">Nome da Campanha</Label>
          <Input
            id="campaignName"
            placeholder="Ex: Campanha Camply"
            value={formData.campaignName}
            onChange={(e) => updateFormData('campaignName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adTitle">Título do Anúncio</Label>
          <Input
            id="adTitle"
            placeholder="Ex: Transforme seu negócio hoje mesmo!"
            value={formData.adTitle}
            onChange={(e) => updateFormData('adTitle', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adText" className="font-medium">
            Texto do Anúncio
          </Label>
          <Textarea
            id="adText"
            placeholder="Ex: Descubra como nossa solução pode ajudar seu negócio a crescer..."
            value={formData.adText}
            onChange={(e) => updateFormData('adText', e.target.value)}
            rows={4}
            className="min-h-[120px] resize-none"
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Use emojis e textos persuasivos para atrair clientes</span>
            <span className="font-mono">{formData.adText.length} caracteres</span>
          </div>
        </div>

        <Button 
          variant="outline"
          className="w-full border-dashed border-blue-300 hover:border-blue-500 mt-6 relative overflow-hidden"
          onClick={onClickCamplyIA}
          disabled={isAILoading}
        >
          {/* Barra de progresso de fundo */}
          {isAILoading && (
            <div 
              className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          )}
          
          {/* Conteúdo do botão */}
          <div className="relative flex items-center justify-center">
            {isAILoading && currentStage ? (
              <>
                <currentStage.icon className="w-4 h-4 mr-2 text-blue-600 animate-pulse" />
                <span className="animate-fade-in">{currentStage.message}</span>
              </>
            ) : (
              <>
                <svg 
                  className="w-4 h-4 mr-2 text-blue-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 10V3L4 14h7v7l9-11h-7z" 
                  />
                </svg>
                Camply IA - Sugestões de Anúncio
              </>
            )}
          </div>
        </Button>
      </CardContent>
    </Card>
  );
};
