import React, { useState } from 'react';
import { FileText, Sparkles, Settings, CheckCircle, Zap, TrendingUp, BarChart3, MessageCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AIWorkflowAnimation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [stepCompleted, setStepCompleted] = useState(false);

  const steps = [
    {
      title: "Preencher Informações",
      description: "Complete os dados do seu consultório",
      icon: FileText,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "IA Analisa",
      description: "Camply.IA consulta suas informações",
      icon: Sparkles,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Configurar Campanha",
      description: "Defina orçamento, datas e locais",
      icon: Settings,
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Leads no WhatsApp",
      description: "Pacientes chegando diretamente",
      icon: MessageCircle,
      color: "from-green-500 to-green-600"
    }
  ];

  const restart = () => {
    setCurrentStep(0);
    setIsProcessing(false);
    setShowResults(false);
    setStepCompleted(false);
  };

  const handleNextStep = () => {
    if (!isProcessing) {
      setIsProcessing(true);
      setStepCompleted(false);
      
      setTimeout(() => {
        setIsProcessing(false);
        setStepCompleted(true);
        
        if (currentStep === steps.length - 1) {
          setTimeout(() => setShowResults(true), 1000);
        }
      }, 2000);
    }
  };

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setStepCompleted(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-background via-background to-muted/20 rounded-2xl border border-border/50 shadow-xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Camply IA em Ação</h3>
        </div>
        <p className="text-muted-foreground">Veja como a inteligência artificial cria sua campanha</p>
      </div>

      {/* Steps Progress */}
      <div className="flex justify-between items-center mb-8 relative">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center relative z-10">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
              ${index <= currentStep 
                ? `bg-gradient-to-r ${step.color} text-white shadow-lg` 
                : 'bg-muted text-muted-foreground border-2 border-border'
              }
              ${index === currentStep && isProcessing ? 'animate-pulse scale-110' : ''}
            `}>
              {index === currentStep && isProcessing ? (
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              ) : (
                React.createElement(step.icon, { className: "w-5 h-5" })
              )}
            </div>
            <span className="text-xs font-medium mt-2 text-center max-w-20">{step.title}</span>
          </div>
        ))}
        
        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-border -z-0">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="min-h-48 relative">
        {!showResults ? (
          <div className="bg-card rounded-xl p-6 border border-border/50">
            {currentStep < steps.length && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${steps[currentStep].color} flex items-center justify-center`}>
                    {React.createElement(steps[currentStep].icon, { className: "w-4 h-4 text-white" })}
                  </div>
                  <h4 className="font-semibold text-foreground">{steps[currentStep].title}</h4>
                </div>
                
                {/* Step Simulation */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Complete os dados básicos do seu consultório para que a IA entenda seu negócio:</p>
                    <div className="grid gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <label className="text-xs font-medium text-foreground">Especialidade</label>
                        <div className="mt-1 p-2 bg-background border border-border rounded text-sm">
                          {!stepCompleted && !isProcessing ? (
                            <span className="text-muted-foreground">Digite sua especialidade...</span>
                          ) : isProcessing ? (
                            <span className="text-muted-foreground">Preenchendo...</span>
                          ) : (
                            "Odontologia Estética"
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <label className="text-xs font-medium text-foreground">Serviços Principais</label>
                        <div className="mt-1 p-2 bg-background border border-border rounded text-sm">
                          {!stepCompleted && !isProcessing ? (
                            <span className="text-muted-foreground">Quais serviços você oferece...</span>
                          ) : isProcessing ? (
                            <span className="text-muted-foreground">Preenchendo...</span>
                          ) : (
                            "Clareamento, Lentes de Contato, Implantes"
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <label className="text-xs font-medium text-foreground">Localização</label>
                        <div className="mt-1 p-2 bg-background border border-border rounded text-sm">
                          {!stepCompleted && !isProcessing ? (
                            <span className="text-muted-foreground">Onde fica seu consultório...</span>
                          ) : isProcessing ? (
                            <span className="text-muted-foreground">Preenchendo...</span>
                          ) : (
                            "São Paulo, SP - Zona Sul"
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!stepCompleted && !isProcessing && (
                      <div className="text-center mt-6">
                        <Button onClick={handleNextStep} className="bg-primary text-primary-foreground hover:bg-primary/90">
                          Preencher Informações
                        </Button>
                      </div>
                    )}
                    
                    {stepCompleted && !isProcessing && (
                      <div className="text-center mt-6">
                        <Button onClick={goToNextStep} className="bg-green-600 hover:bg-green-700 text-white">
                          Próxima Etapa →
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">A Camply.IA está analisando todas as informações do seu consultório para criar o anúncio perfeito:</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                        {!stepCompleted && !isProcessing ? "Clique para começar a análise..." : isProcessing ? "Analisando suas informações..." : "Análise completa:"}
                      </div>
                      {stepCompleted && !isProcessing && (
                        <div className="space-y-3">
                          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                            <div className="text-sm font-medium text-foreground">✓ Público-alvo identificado</div>
                            <div className="text-xs text-muted-foreground mt-1">Mulheres 25-45 anos interessadas em estética dental</div>
                          </div>
                          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                            <div className="text-sm font-medium text-foreground">✓ Melhor horário definido</div>
                            <div className="text-xs text-muted-foreground mt-1">Noites e fins de semana (maior engajamento)</div>
                          </div>
                          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                            <div className="text-sm font-medium text-foreground">✓ Textos otimizados</div>
                            <div className="text-xs text-muted-foreground mt-1">Linguagem adaptada para o seu público</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!stepCompleted && !isProcessing && (
                      <div className="text-center mt-6">
                        <Button onClick={handleNextStep} className="bg-primary text-primary-foreground hover:bg-primary/90">
                          Analisar com IA
                        </Button>
                      </div>
                    )}
                    
                    {stepCompleted && !isProcessing && (
                      <div className="text-center mt-6">
                        <Button onClick={goToNextStep} className="bg-green-600 hover:bg-green-700 text-white">
                          Próxima Etapa →
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Agora você escolhe como sua campanha vai funcionar:</p>
                    <div className="grid gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <label className="text-xs font-medium text-foreground">Orçamento Diário</label>
                        <div className="mt-1 p-2 bg-background border border-border rounded text-sm">
                          {!stepCompleted && !isProcessing ? (
                            <span className="text-muted-foreground">Defina seu orçamento...</span>
                          ) : isProcessing ? (
                            <span className="text-muted-foreground">Configurando...</span>
                          ) : (
                            "R$ 50,00 por dia"
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <label className="text-xs font-medium text-foreground">Período da Campanha</label>
                        <div className="mt-1 p-2 bg-background border border-border rounded text-sm">
                          {!stepCompleted && !isProcessing ? (
                            <span className="text-muted-foreground">Escolha as datas...</span>
                          ) : isProcessing ? (
                            <span className="text-muted-foreground">Configurando...</span>
                          ) : (
                            "15 dias (15/12 até 30/12)"
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <label className="text-xs font-medium text-foreground">Onde Anunciar</label>
                        <div className="mt-1 p-2 bg-background border border-border rounded text-sm">
                          {!stepCompleted && !isProcessing ? (
                            <span className="text-muted-foreground">Selecione as redes sociais...</span>
                          ) : isProcessing ? (
                            <span className="text-muted-foreground">Configurando...</span>
                          ) : (
                            "Facebook e Instagram"
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!stepCompleted && !isProcessing && (
                      <div className="text-center mt-6">
                        <Button onClick={handleNextStep} className="bg-primary text-primary-foreground hover:bg-primary/90">
                          Configurar Campanha
                        </Button>
                      </div>
                    )}
                    
                    {stepCompleted && !isProcessing && (
                      <div className="text-center mt-6">
                        <Button onClick={goToNextStep} className="bg-green-600 hover:bg-green-700 text-white">
                          Próxima Etapa →
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Pronto! Sua campanha está no ar e os pacientes já estão chegando:</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageCircle className={`w-4 h-4 ${isProcessing ? 'animate-pulse' : ''}`} />
                        {!stepCompleted && !isProcessing ? "Clique para ativar sua campanha..." : isProcessing ? "Ativando campanha..." : "Mensagens chegando no WhatsApp:"}
                      </div>
                      {stepCompleted && !isProcessing && (
                        <div className="space-y-2">
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="text-sm font-medium text-green-700 dark:text-green-300">"Olá! Vi seu anúncio sobre clareamento dental..."</div>
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">Maria Silva - há 2 minutos</div>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="text-sm font-medium text-green-700 dark:text-green-300">"Gostaria de agendar uma consulta..."</div>
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">João Santos - há 5 minutos</div>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="text-sm font-medium text-green-700 dark:text-green-300">"Qual o valor das lentes de contato?"</div>
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">Ana Costa - há 8 minutos</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!stepCompleted && !isProcessing && (
                      <div className="text-center mt-6">
                        <Button onClick={handleNextStep} className="bg-primary text-primary-foreground hover:bg-primary/90">
                          Ativar Campanha
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="text-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h4 className="text-xl font-bold text-foreground mb-2">Campanha Criada com Sucesso!</h4>
              <p className="text-muted-foreground">A IA otimizou automaticamente sua campanha</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-foreground">68</div>
                <div className="text-xs text-muted-foreground">Pacientes no WhatsApp</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-foreground">R$ 2,85</div>
                <div className="text-xs text-muted-foreground">Custo por Lead</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <Target className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-foreground">3.2k</div>
                <div className="text-xs text-muted-foreground">Pessoas Alcançadas</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="text-center mt-6">
        <Button 
          onClick={restart}
          variant="outline"
          className="gap-2"
        >
          <Zap className="w-4 h-4" />
          Ver Novamente
        </Button>
      </div>

      {/* AI Particles Effect */}
      {isProcessing && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full animate-bounce opacity-60"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 20}%`,
                animationDelay: `${i * 200}ms`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};