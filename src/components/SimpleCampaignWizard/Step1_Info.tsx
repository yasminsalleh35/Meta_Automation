
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
import { AISuggestionsCard } from '@/components/campaign/AISuggestionsCard';

interface Step1InfoProps {
  formData: SimpleCampaignFormData;
  updateFormData: (field: keyof SimpleCampaignFormData, value: any) => void;
}

export const Step1Info: React.FC<Step1InfoProps> = ({ formData, updateFormData }) => {
  const { toast } = useToast();
  const {
    isAILoading,
    aiSuggestions,
    handleAISuggestion
  } = useAISuggestions();

  const { progress, currentStage, isInFinalStage } = useAILoadingProgress(isAILoading);

  const onClickCamplyIA = async () => {
    try {
      await handleAISuggestion("gerar leads via WhatsApp", (suggestions) => {
        if (suggestions) {
          // Apply ad title and text immediately
          if (suggestions.adTitle) {
            updateFormData('adTitle', suggestions.adTitle);
          }
          if (suggestions.adText) {
            updateFormData('adText', suggestions.adText);
          }

          toast({
            title: "Sugestões geradas com sucesso!",
            description: "Título e texto aplicados. Veja abaixo as sugestões completas de público, orçamento e localização.",
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

  const handleApplyAllSuggestions = (suggestions: any) => {
    // Apply budget
    if (suggestions.budget?.daily) {
      updateFormData('dailyBudget', suggestions.budget.daily);
    }
    // Apply end date
    if (suggestions.duration?.endDate) {
      updateFormData('endDate', new Date(suggestions.duration.endDate));
    }
    // Auto-enable AI targeting mode and store targeting data
    updateFormData('useAISuggestions', true);
    updateFormData('aiTargeting', {
      interests: (suggestions.interests || []).map((name: string) => ({ id: '', name })),
      ageMin: suggestions.audience?.ageMin || 25,
      ageMax: suggestions.audience?.ageMax || 55,
      genders: suggestions.audience?.gender || 'all',
    });
    toast({
      title: "Sugestões da IA aplicadas!",
      description: "Segmentação, orçamento e duração atualizados. A IA será usada para o público-alvo desta campanha.",
    });
  };

  const handleToggleTargeting = (useAI: boolean) => {
    updateFormData('useAISuggestions', useAI);
    if (!useAI) {
      updateFormData('aiTargeting', null);
    } else if (aiSuggestions) {
      updateFormData('aiTargeting', {
        interests: (aiSuggestions.interests || []).map((name: string) => ({ id: '', name })),
        ageMin: aiSuggestions.audience?.ageMin || 25,
        ageMax: aiSuggestions.audience?.ageMax || 55,
        genders: aiSuggestions.audience?.gender || 'all',
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

        {/* AI Full Suggestions Card — shows audience, budget, location after generation */}
        {aiSuggestions && (
          <>
            <AISuggestionsCard
              isLoading={isAILoading}
              suggestions={aiSuggestions}
              hasObjective={true}
              onGenerateSuggestions={onClickCamplyIA}
              onApplySuggestions={handleApplyAllSuggestions}
            />

            {/* AI vs Profile targeting toggle */}
            <div className="rounded-lg border p-4 space-y-3">
              <Label className="text-sm font-medium">Segmentação do Público</Label>
              <div className="flex flex-col gap-2">
                <label
                  className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                    formData.useAISuggestions
                      ? 'border-green-500 bg-green-50'
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetingMode"
                    checked={formData.useAISuggestions === true}
                    onChange={() => handleToggleTargeting(true)}
                    className="accent-green-600"
                  />
                  <div>
                    <span className="font-medium text-sm">Usar sugestões da IA</span>
                    <p className="text-xs text-muted-foreground">
                      Interesses, idade e gênero gerados pela IA para esta campanha
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                    !formData.useAISuggestions
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetingMode"
                    checked={!formData.useAISuggestions}
                    onChange={() => handleToggleTargeting(false)}
                    className="accent-blue-600"
                  />
                  <div>
                    <span className="font-medium text-sm">Usar perfil padrão</span>
                    <p className="text-xs text-muted-foreground">
                      Segmentação do perfil de campanha configurado em "Meu Negócio"
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
