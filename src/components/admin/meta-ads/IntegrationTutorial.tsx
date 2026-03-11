
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Users, 
  Settings, 
  ExternalLink,
  Key,
  Link,
  Monitor,
  CreditCard,
  Building,
  Image,
  Target
} from 'lucide-react';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  type: 'admin' | 'verification' | 'client' | 'testing';
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: "Configuração Inicial - Credenciais Globais",
    description: "Configure as credenciais do Meta App que serão usadas por todos os clientes",
    icon: <Key className="w-6 h-6" />,
    type: 'admin',
    content: (
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Pré-requisito:</strong> Você deve ter um Meta App criado no Meta for Developers
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-1 mt-1">
              <span className="text-blue-600 text-sm font-bold px-2">1.1</span>
            </div>
            <div>
              <p className="font-medium">Acesse o Painel Administrativo</p>
              <p className="text-sm text-gray-600">Menu lateral → "Integrações Meta Ads"</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-1 mt-1">
              <span className="text-blue-600 text-sm font-bold px-2">1.2</span>
            </div>
            <div>
              <p className="font-medium">Localize a seção "Configurações Globais do Meta App"</p>
              <p className="text-sm text-gray-600">Esta seção fica no topo da página</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-1 mt-1">
              <span className="text-blue-600 text-sm font-bold px-2">1.3</span>
            </div>
            <div>
              <p className="font-medium">Preencha os campos obrigatórios:</p>
              <ul className="text-sm text-gray-600 ml-4 mt-1">
                <li>• <strong>App ID:</strong> ID do seu Meta App (ex: 1205142370824559)</li>
                <li>• <strong>App Secret:</strong> Secret do seu Meta App (use o botão do olho para visualizar)</li>
                <li>• <strong>Business Manager ID:</strong> (Opcional) ID do seu Business Manager</li>
              </ul>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-1 mt-1">
              <span className="text-blue-600 text-sm font-bold px-2">1.4</span>
            </div>
            <div>
              <p className="font-medium">Clique em "Salvar Configurações"</p>
              <p className="text-sm text-gray-600">Aguarde a confirmação de sucesso</p>
            </div>
          </div>
        </div>
        
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Importante:</strong> Essas credenciais serão usadas para TODOS os clientes. Mantenha-as seguras e não as compartilhe.
          </AlertDescription>
        </Alert>
      </div>
    )
  },
  {
    id: 2,
    title: "Verificação de Pré-requisitos do Cliente",
    description: "Confirme que o cliente possui todos os recursos necessários no Meta",
    icon: <CheckCircle className="w-6 h-6" />,
    type: 'verification',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">Antes de iniciar a integração, verifique se o cliente possui:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium">Conta Facebook Pessoal</h4>
            </div>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>✓ Conta ativa e verificada</li>
              <li>✓ Acesso a facebook.com</li>
              <li>✓ Email confirmado</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Building className="w-5 h-5 text-green-600" />
              <h4 className="font-medium">Business Manager</h4>
            </div>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>✓ Business Manager criado</li>
              <li>✓ Cliente é admin do BM</li>
              <li>✓ BM verificado (se necessário)</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Target className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium">Conta de Anúncios</h4>
            </div>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>✓ Conta de anúncios ativa</li>
              <li>✓ Limite de gastos configurado</li>
              <li>✓ Forma de pagamento válida</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Image className="w-5 h-5 text-pink-600" />
              <h4 className="font-medium">Página/Instagram</h4>
            </div>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>✓ Página Facebook criada</li>
              <li>✓ Instagram conectado (se usar)</li>
              <li>✓ Cliente é admin da página</li>
            </ul>
          </div>
        </div>
        
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Atenção:</strong> Se algum item não estiver configurado, oriente o cliente a configurar ANTES de prosseguir com a integração.
          </AlertDescription>
        </Alert>
      </div>
    )
  },
  {
    id: 3,
    title: "Localizar Cliente no Sistema",
    description: "Encontre o cliente na lista e prepare para configurar a integração",
    icon: <Users className="w-6 h-6" />,
    type: 'admin',
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 rounded-full p-1 mt-1">
              <span className="text-green-600 text-sm font-bold px-2">3.1</span>
            </div>
            <div>
              <p className="font-medium">Na página "Integrações Meta Ads", localize a seção "Usuários"</p>
              <p className="text-sm text-gray-600">Lista com todos os usuários cadastrados no sistema</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 rounded-full p-1 mt-1">
              <span className="text-green-600 text-sm font-bold px-2">3.2</span>
            </div>
            <div>
              <p className="font-medium">Use os filtros para encontrar o cliente:</p>
              <ul className="text-sm text-gray-600 ml-4 mt-1">
                <li>• <strong>Busca:</strong> Digite email ou nome do cliente</li>
                <li>• <strong>Status:</strong> "Desconectados" para ver quem precisa integrar</li>
              </ul>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 rounded-full p-1 mt-1">
              <span className="text-green-600 text-sm font-bold px-2">3.3</span>
            </div>
            <div>
              <p className="font-medium">Verifique o status atual do cliente:</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>
                  <span className="text-sm text-gray-600">- Integração ativa</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary"><Users className="w-3 h-3 mr-1" />Desconectado</Badge>
                  <span className="text-sm text-gray-600">- Precisa configurar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Dica:</strong> Clientes com status "Desconectado" são os que precisam de integração ou tiveram a integração removida.
          </AlertDescription>
        </Alert>
      </div>
    )
  },
  {
    id: 4,
    title: "Iniciar Configuração da Integração",
    description: "Execute o processo de configuração para o cliente específico",
    icon: <Settings className="w-6 h-6" />,
    type: 'admin',
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 rounded-full p-1 mt-1">
              <span className="text-purple-600 text-sm font-bold px-2">4.1</span>
            </div>
            <div>
              <p className="font-medium">Clique no botão "Configurar" do cliente escolhido</p>
              <p className="text-sm text-gray-600">Botão fica na coluna "Ações" da tabela</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 rounded-full p-1 mt-1">
              <span className="text-purple-600 text-sm font-bold px-2">4.2</span>
            </div>
            <div>
              <p className="font-medium">Uma nova janela do navegador será aberta</p>
              <p className="text-sm text-gray-600">Esta janela é do Meta/Facebook para autorização OAuth</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 rounded-full p-1 mt-1">
              <span className="text-purple-600 text-sm font-bold px-2">4.3</span>
            </div>
            <div>
              <p className="font-medium">Aguarde o cliente fazer login (se necessário)</p>
              <p className="text-sm text-gray-600">O cliente deve usar as credenciais da conta Facebook dele</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 rounded-full p-1 mt-1">
              <span className="text-purple-600 text-sm font-bold px-2">4.4</span>
            </div>
            <div>
              <p className="font-medium">Cliente deve autorizar as permissões solicitadas:</p>
              <ul className="text-sm text-gray-600 ml-4 mt-1">
                <li>• Gerenciar anúncios</li>
                <li>• Acessar páginas</li>
                <li>• Ler insights de páginas</li>
                <li>• Gerenciar Business Manager</li>
              </ul>
            </div>
          </div>
        </div>
        
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Importante:</strong> O processo OAuth é seguro e as credenciais ficam apenas com o Meta. Seu sistema recebe apenas tokens de acesso temporários.
          </AlertDescription>
        </Alert>
      </div>
    )
  },
  {
    id: 5,
    title: "Validação e Finalização",
    description: "Confirme que a integração foi bem-sucedida e está funcionando",
    icon: <Monitor className="w-6 h-6" />,
    type: 'testing',
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="bg-orange-100 rounded-full p-1 mt-1">
              <span className="text-orange-600 text-sm font-bold px-2">5.1</span>
            </div>
            <div>
              <p className="font-medium">Aguarde o fechamento automático da janela OAuth</p>
              <p className="text-sm text-gray-600">Isso indica que a autorização foi concluída</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-orange-100 rounded-full p-1 mt-1">
              <span className="text-orange-600 text-sm font-bold px-2">5.2</span>
            </div>
            <div>
              <p className="font-medium">Verifique a notificação de sucesso</p>
              <p className="text-sm text-gray-600">Deve aparecer: "Meta Ads conectado para [email do cliente]"</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-orange-100 rounded-full p-1 mt-1">
              <span className="text-orange-600 text-sm font-bold px-2">5.3</span>
            </div>
            <div>
              <p className="font-medium">Confirme a mudança de status na tabela</p>
              <p className="text-sm text-gray-600">Status deve mudar para "Conectado" com ícone verde</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-orange-100 rounded-full p-1 mt-1">
              <span className="text-orange-600 text-sm font-bold px-2">5.4</span>
            </div>
            <div>
              <p className="font-medium">Teste a integração:</p>
              <ul className="text-sm text-gray-600 ml-4 mt-1">
                <li>• Clique em "Ver" para abrir detalhes da integração</li>
                <li>• Verifique se mostra conta de anúncios e páginas</li>
                <li>• Confirme data/hora da integração</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Sucesso:</strong> Cliente pode agora criar campanhas usando as contas dele
            </AlertDescription>
          </Alert>
          
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Erro:</strong> Se algo falhar, verifique as credenciais globais e tente novamente
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  },
  {
    id: 6,
    title: "Pós-Configuração e Manutenção",
    description: "Orientações para manter a integração funcionando e resolver problemas",
    icon: <Link className="w-6 h-6" />,
    type: 'admin',
    content: (
      <div className="space-y-4">
        <h4 className="font-medium text-lg">Ações Disponíveis Pós-Integração:</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-2 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Ver Detalhes
            </h5>
            <p className="text-sm text-gray-600">
              Visualizar informações da integração: contas de anúncio, páginas conectadas, data da integração.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2 text-red-600" />
              Desconectar
            </h5>
            <p className="text-sm text-gray-600">
              Remove a integração do cliente. Use apenas se solicitado ou em caso de problemas.
            </p>
          </div>
        </div>
        
        <h4 className="font-medium text-lg mt-6">Solução de Problemas Comuns:</h4>
        
        <div className="space-y-3">
          <div className="border-l-4 border-yellow-400 pl-4">
            <p className="font-medium">Cliente não consegue autorizar</p>
            <p className="text-sm text-gray-600">
              • Verifique se ele tem conta Facebook ativa<br/>
              • Confirme se as credenciais globais estão corretas<br/>
              • Teste com outro navegador/dispositivo
            </p>
          </div>
          
          <div className="border-l-4 border-red-400 pl-4">
            <p className="font-medium">Erro "Credenciais inválidas"</p>
            <p className="text-sm text-gray-600">
              • Verifique App ID e App Secret nas configurações globais<br/>
              • Confirme se o Meta App está ativo<br/>
              • Verifique permissões do App no Meta for Developers
            </p>
          </div>
          
          <div className="border-l-4 border-blue-400 pl-4">
            <p className="font-medium">Cliente não vê suas contas de anúncio</p>
            <p className="text-sm text-gray-600">
              • Confirme se ele é admin das contas<br/>
              • Verifique se as contas estão ativas<br/>
              • Pode precisar de nova autorização
            </p>
          </div>
        </div>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Lembre-se:</strong> Mantenha documentado quais clientes têm integração ativa para facilitar suporte futuro.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
];

export const IntegrationTutorial: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const currentStepData = tutorialSteps.find(step => step.id === currentStep);

  const markStepCompleted = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const getStepTypeColor = (type: TutorialStep['type']) => {
    switch (type) {
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'verification': return 'bg-yellow-100 text-yellow-800';
      case 'client': return 'bg-green-100 text-green-800';
      case 'testing': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepTypeLabel = (type: TutorialStep['type']) => {
    switch (type) {
      case 'admin': return 'Admin';
      case 'verification': return 'Verificação';
      case 'client': return 'Cliente';
      case 'testing': return 'Teste';
      default: return 'Geral';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tutorial: Integração Meta Ads
        </h1>
        <p className="text-gray-600">
          Guia completo passo a passo para configurar integrações Meta Ads para clientes
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            Progresso do Tutorial
          </CardTitle>
          <CardDescription>
            {completedSteps.length} de {tutorialSteps.length} passos concluídos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {tutorialSteps.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  currentStep === step.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : completedSteps.includes(step.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className="text-xs font-medium">Passo {step.id}</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{step.title}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      {currentStepData && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  {currentStepData.icon}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <CardTitle>Passo {currentStepData.id}: {currentStepData.title}</CardTitle>
                    <Badge className={getStepTypeColor(currentStepData.type)}>
                      {getStepTypeLabel(currentStepData.type)}
                    </Badge>
                  </div>
                  <CardDescription>{currentStepData.description}</CardDescription>
                </div>
              </div>
              <Button
                variant={completedSteps.includes(currentStepData.id) ? "default" : "outline"}
                size="sm"
                onClick={() => markStepCompleted(currentStepData.id)}
              >
                {completedSteps.includes(currentStepData.id) ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Concluído
                  </>
                ) : (
                  'Marcar como Concluído'
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {currentStepData.content}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Passo Anterior
        </Button>
        
        <div className="text-sm text-gray-500">
          {currentStep} de {tutorialSteps.length}
        </div>
        
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.min(tutorialSteps.length, currentStep + 1))}
          disabled={currentStep === tutorialSteps.length}
        >
          Próximo Passo
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExternalLink className="w-5 h-5 mr-2" />
            Links Úteis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Meta for Developers</span>
            </a>
            <a
              href="https://business.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Business Manager</span>
            </a>
            <a
              href="https://adsmanager.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Ads Manager</span>
            </a>
            <a
              href="/admin/meta-ads"
              className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Painel de Integrações</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
