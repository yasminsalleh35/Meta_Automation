
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SimpleMessagesAnimation } from '@/components/landing/SimpleMessagesAnimation';
import { AIWorkflowAnimation } from '@/components/landing/AIWorkflowAnimation';
import { DentistScheduleAnimation } from '@/components/landing/DentistScheduleAnimation';
import { MetaCertificationsSection } from '@/components/landing/MetaCertificationsSection';
import { PrecisionAIAnimation } from '@/components/animations/PrecisionAIAnimation';
import { DentistComparisonCarousel } from '@/components/landing/DentistComparisonCarousel';
import { PricingSection } from '@/components/landing/PricingSection';
import { 
  Check, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  MessageCircle, 
  BarChart3,
  Sparkles,
  ArrowRight,
  Quote,
  Calculator,
  CreditCard,
  Banknote,
  Shield,
  Infinity,
  Bot,
  Headphones,
  Award,
  Zap,
  Lock,
  Brain
} from 'lucide-react';
import dentistHeroImage from '@/assets/dentist-hero-image.jpg';

export const DentistLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="py-3 sm:py-4 px-4 border-b bg-white shadow-sm">
        <div className="container-responsive flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/assets/images/ee751fd8-27e0-476e-9479-10ef458dbe4e.png" 
              alt="Camply Logo" 
              className="h-6 sm:h-8 w-auto"
            />
          </div>
          <Link to="/auth/register">
            <Button variant="outline" size="sm" className="border-camply-blue text-camply-blue hover:bg-camply-blue hover:text-white btn-touch">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 px-4">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <Badge className="mb-6 sm:mb-8 bg-camply-blue text-white border-0 text-sm sm:text-base">
                🦷 Para Dentistas
              </Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
                Dentista, pare de perder pacientes por não anunciar!
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 leading-relaxed">
                Com o Camply, você gera novos contatos todos os dias no seu WhatsApp — sem contratar gestor de tráfego, sem agências caras e sem depender de conhecimento técnico.
              </p>
              <Link to="/auth/register">
                <Button size="lg" className="bg-camply-blue hover:bg-blue-700 text-white px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all btn-touch w-full sm:w-auto">
                  Quero Começar com o Camply
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
            </div>
            
            {/* Right Column - Animation */}
            <div className="flex justify-center lg:justify-end order-1 lg:order-2">
              <div className="w-full max-w-md lg:max-w-none">
                <SimpleMessagesAnimation />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Camply */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50">
        <div className="container-responsive text-center">
          <h2 className="heading-responsive font-bold text-gray-900 mb-6 sm:mb-8">
            Camply: seu consultório cheio com ajuda de IA
          </h2>
          <p className="text-responsive text-gray-600 mb-10 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
            Camply é uma plataforma inteligente que cria, gerencia e otimiza automaticamente seus anúncios no Instagram e Facebook. Ideal para dentistas que querem atrair pacientes sem perder tempo com complicações.
          </p>
          
          {/* Vídeo explicativo */}
          <div className="max-w-4xl mx-auto mb-10 sm:mb-12">
            <div className="relative w-full aspect-video">
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg sm:rounded-xl shadow-lg"
                src="https://www.youtube.com/embed/SVsJsBt4rjc"
                title="Camply: Como funciona a plataforma para dentistas"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
          
          <div className="mb-10 sm:mb-12">
            <DentistScheduleAnimation />
          </div>
          
          <div className="bg-white card-responsive rounded-xl shadow-sm border max-w-2xl mx-auto">
            <p className="text-lg sm:text-xl font-semibold text-camply-blue">
              Mais de 3.400 campanhas já lançadas com sucesso para profissionais de saúde.
            </p>
          </div>
        </div>
      </section>

      {/* Why Perfect for Dentists */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container-responsive">
          <h2 className="heading-responsive font-bold text-gray-900 mb-12 sm:mb-16 text-center">
            Por que o Camply é perfeito para dentistas?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Clock,
                title: "Criação em 5 minutos",
                description: "campanha 100% pronta com poucos cliques"
              },
              {
                icon: MessageCircle,
                title: "Leads diretos no WhatsApp",
                description: "sem landing page, sem complicações"
              },
              {
                icon: Sparkles,
                title: "Campanhas ilimitadas",
                description: "crie e pause quando quiser, sem limites"
              },
              {
                icon: Users,
                title: "Suporte total na configuração",
                description: "equipe te acompanha do início ao fim"
              },
              {
                icon: BarChart3,
                title: "Relatórios completos",
                description: "saiba se seus anúncios estão com desempenho ruim, médio ou bom"
              },
              {
                icon: TrendingUp,
                title: "IA especializada em dentistas",
                description: "otimiza seus anúncios em tempo real para melhorar resultados"
              }
            ].map((feature, index) => (
              <Card key={index} className="text-left hover:shadow-md transition-all duration-200 border-gray-200 h-full">
                <CardContent className="card-responsive h-full">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="bg-blue-50 p-2 sm:p-3 rounded-lg flex-shrink-0">
                      <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-camply-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-base sm:text-lg">{feature.title}</h3>
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Video Tutorial Section */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50">
        <div className="container-responsive">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Veja como é simples e rápido configurar sua primeira campanha
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Em menos de 5 minutos, sua campanha estará no ar atraindo novos pacientes para seu consultório
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src="https://www.youtube.com/embed/KXLpZ21NlAo?si=J7vlHDYUSZZ6dq8T"
                title="Como configurar sua primeira campanha no Camply"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      <DentistComparisonCarousel />

      {/* Highlights Section */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container-responsive">
          <div className="mt-12 sm:mt-16">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="card-responsive">
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Destaques</h3>
                </div>
                
                <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Camply: Economia Real</h4>
                        <p className="text-blue-800">
                          <strong>Economize cerca de 90–95%</strong> em gestão mensal comparado ao mercado, 
                          com pacote completo por <strong className="bg-yellow-200 px-2 py-1 rounded animate-pulse">menos de R$ 170/mês</strong>.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <Users className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Gestores de Tráfego</h4>
                        <p className="text-gray-600">
                          Custos médios entre <strong>R$ 1.500 a R$ 5.000/mês</strong> para um freelancer, 
                          e até <strong>R$ 15.000/mês</strong> ou mais em agências completas.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Agências de Marketing</h4>
                        <p className="text-gray-600">
                          Exigem pacotes geralmente entre <strong>R$ 1.500 e R$ 5.000/mês</strong>, 
                          podendo chegar a <strong>R$ 15.000/mês</strong> dependendo da complexidade.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">Conclusão</span>
                      </div>
                      <p className="text-green-700 text-sm">
                        Com Camply, você <strong>economiza milhares de reais por ano</strong> 
                        e ainda tem resultados superiores com IA especializada.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-8 sm:mt-12">
            <Link to="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 w-full sm:w-auto btn-touch">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Quero economizar e atrair mais pacientes
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Camply Precision AI Section */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container-responsive text-center">
          <h2 className="heading-responsive font-bold text-gray-900 mb-6 sm:mb-8">
            🤖 Camply Precision AI™ – tecnologia que transforma dados em pacientes reais
          </h2>
          <p className="text-responsive text-gray-600 mb-12 sm:mb-16 max-w-4xl mx-auto leading-relaxed">
            Nada de achismo. A Camply utiliza estatística, tecnologia e informação para estruturar campanhas dentro do ecossistema Meta, aplicando interesses, exclusões de interesse, segmentações geográficas e otimização para eventos de forma automatizada.
          </p>
          
          {/* AI Animation */}
          <div className="mb-12 sm:mb-16">
            <PrecisionAIAnimation />
          </div>
          
          {/* Technical Features Grid */}
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto mb-8 sm:mb-12">
            <div className="bg-gray-50 card-responsive rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🔬</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Tecnologia exclusiva para dentistas</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Nossa IA combina interesses específicos de odontologia com exclusões estratégicas para filtrar curiosos e manter apenas leads qualificados.
              </p>
            </div>
            
            <div className="bg-gray-50 card-responsive rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📊</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Dados, não opinião</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Baseamos a segmentação em públicos personalizados e lookalikes, aplicando ajustes dinâmicos de frequência e posicionamento sem depender de tentativa e erro.
              </p>
            </div>
            
            <div className="bg-gray-50 card-responsive rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🎯</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Assertividade de ponta</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                A Camply Precision AI™ entende o fluxo de campanhas dentro do Facebook Business Manager e traduz para você, de forma simplificada, tudo o que envolve critérios de público, orçamento, criativos e otimização para resultado.
              </p>
            </div>
            
            <div className="bg-gray-50 card-responsive rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">💡</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">O paciente certo, na hora certa</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Ao cruzar informações de interesse odontológico e capacidade de investimento, direcionamos sua clínica apenas para pacientes que têm intenção real e condições de contratação.
              </p>
            </div>
          </div>
          
          {/* Precision AI CTA */}
          <div className="mt-8 sm:mt-12">
            <Link to="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-xl font-bold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 w-full sm:w-auto btn-touch">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                <span className="hidden sm:inline">Ative agora a Camply Precision AI™ e veja sua clínica conquistar mais pacientes qualificados</span>
                <span className="sm:hidden">Ativar Camply Precision AI™</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Meta Certifications */}
      <MetaCertificationsSection />

      {/* Results */}
      <section className="py-16 sm:py-20 px-4 bg-camply-blue text-white">
        <div className="container-responsive text-center">
          <h2 className="heading-responsive font-bold mb-12 sm:mb-16">Resultados Reais</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: Users, label: "+75.000 leads gerados", value: "📥" },
              { icon: Clock, label: "4min23s para lançar uma campanha", value: "⏱️" },
              { icon: TrendingUp, label: "Até 73% menos custo por lead vs. agências", value: "📈" },
              { icon: DollarSign, label: "Economia de +R$ 12 mil/ano em gestão de tráfego", value: "💰" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{stat.value}</div>
                <p className="text-sm sm:text-base lg:text-lg font-semibold leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50">
        <div className="container-responsive">
          <h2 className="heading-responsive font-bold text-gray-900 mb-12 sm:mb-16 text-center">
            Como funciona
          </h2>
          <p className="text-responsive text-gray-600 mb-10 sm:mb-12 text-center max-w-3xl mx-auto">
            Veja como é simples criar uma campanha otimizada com nossa IA especializada em dentistas
          </p>
          
          <div className="mb-12 sm:mb-16">
            <AIWorkflowAnimation />
          </div>
          
          <div className="text-center">
            <div className="bg-white card-responsive rounded-xl shadow-sm border max-w-2xl mx-auto">
              <p className="text-lg sm:text-xl font-semibold text-gray-900">
                Não precisa entender de tráfego pago. O Camply faz tudo por você.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ethics Compliance Section */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container-responsive">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="heading-responsive font-bold text-gray-900 mb-6 sm:mb-8">
              Publicidade ética, gerada por IA e compatível com as normas do CRO/CFO
            </h2>
            <p className="text-responsive text-gray-600 mb-10 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
              Na Camply.ia, nossa prioridade é gerar textos que estejam 100% alinhados à ética odontológica. Nossas cópias automáticas seguem rigorosamente o Código de Ética do CFO e a Resolução 196/2019, garantindo que:
            </p>
          </div>

          {/* Compliance Rules Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {[
              {
                icon: Award,
                title: "Nome e CRO sempre visíveis",
                description: "Identificação profissional clara em todos os anúncios"
              },
              {
                icon: Shield,
                title: "Linguagem profissional",
                description: "Sem promessas irreais ou termos sensacionalistas"
              },
              {
                icon: Check,
                title: "Sem garantias de resultado",
                description: "Comunicação ética e responsável"
              },
              {
                icon: Lock,
                title: "Imagens adequadas",
                description: "Sem 'antes e depois' ou procedimentos sem autorização"
              }
            ].map((rule, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-all duration-200 border-gray-200 h-full">
                <CardContent className="card-responsive h-full">
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <rule.icon className="w-6 h-6 sm:w-8 sm:h-8 text-camply-blue" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-base sm:text-lg">{rule.title}</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{rule.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ethics Seal */}
          <div className="text-center">
            <Card className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
              <CardContent className="card-responsive">
                <div className="bg-white p-3 sm:p-4 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 flex items-center justify-center shadow-sm">
                  <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-camply-blue" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Conforme às normas CRO/CFO</h3>
                <p className="text-sm text-gray-600 mb-3 sm:mb-4">Exemplo de identificação:</p>
                <div className="bg-white rounded-lg p-3 border">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">Dr. João Silva – CRO-MG 12345</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional text */}
          <div className="text-center mt-8 sm:mt-12">
            <p className="text-lg sm:text-xl font-semibold text-camply-blue">
              Com a Camply.ia, você comunica com segurança, profissionalismo e conformidade — captando pacientes e respeitando o Código de Ética da Odontologia.*
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container-responsive">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-red-100 text-red-700 rounded-full mb-4 sm:mb-6 text-sm sm:text-base">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Oferta Limitada - Últimas Vagas
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Investimento que Transforma sua Clínica
              </h2>
              <p className="text-lg sm:text-xl text-gray-600">
                Pare de gastar fortunas com agências e tenha controle total dos seus anúncios
              </p>
            </div>

            <Card className="relative shadow-2xl border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50">
              <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-600 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
                  PLANO MAIS ESCOLHIDO
                </div>
              </div>
              
              <CardContent className="card-responsive">
                {/* Pricing Header */}
                <div className="text-center mb-8 sm:mb-10">
                  <div className="flex items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <span className="text-lg sm:text-2xl text-gray-500 line-through">DE R$ 4.500</span>
                    <TrendingDown className="w-4 h-4 sm:w-6 sm:h-6 text-red-500" />
                  </div>
                  <div className="mb-3 sm:mb-4">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600">R$ 2.000</span>
                    <span className="text-lg sm:text-xl text-gray-600 ml-2">/ano</span>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 sm:px-4 py-2 rounded-lg inline-block mb-4 sm:mb-6 text-sm sm:text-base">
                    <Calculator className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                    Economia de R$ 2.500 (55% OFF)
                  </div>
                  
                  {/* Payment Options */}
                  <div className="bg-blue-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="text-center">
                        <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-blue-600 mb-2" />
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">12x sem juros</p>
                        <p className="text-blue-600 text-base sm:text-lg font-bold">R$ 166,66/mês</p>
                      </div>
                      <div className="text-center">
                        <Banknote className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-green-600 mb-2" />
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">À vista</p>
                        <p className="text-green-600 text-base sm:text-lg font-bold">R$ 2.000</p>
                      </div>
                    </div>
                    <div className="flex justify-center gap-1 sm:gap-4 mt-3 sm:mt-4 opacity-60">
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-4 sm:w-8 sm:h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                        <div className="w-6 h-4 sm:w-8 sm:h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
                        <div className="w-6 h-4 sm:w-8 sm:h-5 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">ELO</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
                  {[
                    { icon: Shield, title: "Acesso completo por 12 meses", desc: "Plataforma completa sem limitações" },
                    { icon: Infinity, title: "Campanhas ilimitadas", desc: "Crie quantas campanhas precisar" },
                    { icon: BarChart3, title: "Relatórios automáticos", desc: "Análises precisas e detalhadas" },
                    { icon: Bot, title: "Otimização por IA", desc: "Inteligência artificial trabalhando 24h" },
                    { icon: Headphones, title: "Suporte especializado", desc: "Equipe técnica dedicada" },
                    { icon: DollarSign, title: "Valor fixo garantido", desc: "Sem taxas por lead ou surpresas" }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3 sm:space-x-4">
                      <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                        <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{feature.title}</h4>
                        <p className="text-gray-600 text-xs sm:text-sm">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trust Elements */}
                <div className="bg-green-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                  <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      <span className="text-xs sm:text-sm font-medium text-green-800">Pagamento 100% Seguro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      <span className="text-xs sm:text-sm font-medium text-green-800">+500 Dentistas Confiam</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      <span className="text-xs sm:text-sm font-medium text-green-800">Garantia de Resultados</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Link to="/auth/register">
                  <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 sm:px-10 py-4 sm:py-6 text-lg sm:text-xl font-bold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 btn-touch">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                    <span className="hidden sm:inline">Garantir Minha Vaga por R$ 2.000</span>
                    <span className="sm:hidden">Garantir Minha Vaga</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3" />
                  </Button>
                </Link>

                <p className="text-center text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                  Dados protegidos por SSL. Cancelamento sem burocracias.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50">
        <div className="container-responsive">
          <h2 className="heading-responsive font-bold text-gray-900 mb-12 sm:mb-16 text-center">
            Dentistas recomendam:
          </h2>
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {[
              {
                quote: "Eu gastava R$ 1.800 por mês com agência. Com Camply, pago uma vez no ano e tenho mais resultado.",
                author: "Dr. Matheus Ferreira",
                specialty: "Ortodontista"
              },
              {
                quote: "O painel me mostra quando o anúncio tá ruim, e a IA melhora pra mim sem eu mexer em nada.",
                author: "Dra. Luana Tavares",
                specialty: "Especialista em Estética Dental"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="shadow-md border-gray-200 h-full">
                <CardContent className="card-responsive h-full flex flex-col">
                  <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-camply-blue mb-4 sm:mb-6 flex-shrink-0" />
                  <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-6 italic leading-relaxed flex-grow">"{testimonial.quote}"</p>
                  <div className="text-right border-t border-gray-100 pt-3 sm:pt-4">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">— {testimonial.author}</p>
                    <p className="text-gray-600 text-sm">{testimonial.specialty}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 bg-camply-blue text-white">
        <div className="container-responsive text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 max-w-4xl mx-auto">
            Você está a um clique de começar a receber pacientes no WhatsApp
          </h2>
          <p className="text-lg sm:text-xl mb-8 sm:mb-10 opacity-90">Ative sua conta agora mesmo</p>
          <Link to="/auth/register">
            <Button size="lg" className="bg-white text-camply-blue hover:bg-gray-100 px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all btn-touch w-full sm:w-auto">
              Quero Começar com o Camply
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container-responsive max-w-4xl">
          <h2 className="heading-responsive font-bold text-gray-900 mb-12 sm:mb-16 text-center">
            Perguntas Frequentes (FAQ)
          </h2>
          <div className="space-y-6 sm:space-y-8">
            {[
              {
                question: "O Camply serve para qualquer dentista?",
                answer: "Sim! Você pode anunciar clareamento, aparelho, lente, implante, botox, harmonização, e muito mais."
              },
              {
                question: "Preciso ter conta no Gerenciador de Anúncios?",
                answer: "Não. A Camply cuida de tudo. Basta conectar sua conta do Instagram e do Facebook."
              },
              {
                question: "Como funcionam os relatórios?",
                answer: "Você vê o desempenho da campanha em tempo real, com classificações simples: ruim, médio ou bom. E a IA já sugere otimizações automáticas."
              },
              {
                question: "Consigo criar quantos anúncios?",
                answer: "Ilimitados. O plano anual te dá liberdade total para testar e escalar."
              },
              {
                question: "Vocês me ajudam a configurar?",
                answer: "Sim! Nosso suporte te acompanha até sua primeira campanha estar no ar."
              }
            ].map((faq, index) => (
              <Card key={index} className="border-gray-200">
                <CardContent className="card-responsive">
                  <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">{faq.question}</h3>
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 bg-gray-900 text-white">
        <div className="container-responsive text-center">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <img 
              src="/assets/images/ee751fd8-27e0-476e-9479-10ef458dbe4e.png" 
              alt="Camply Logo" 
              className="h-5 sm:h-6 w-auto"
            />
          </div>
          <p className="text-gray-400 text-sm sm:text-base">© 2024 Camply. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default DentistLandingPage;
