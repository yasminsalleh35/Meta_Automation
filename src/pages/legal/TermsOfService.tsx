
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
          
          {/* Header with Logo */}
          <div className="flex items-center space-x-3 mb-4">
            <img 
              src="/assets/images/ee751fd8-27e0-476e-9479-10ef458dbe4e.png" 
              alt="Camply" 
              className="h-8 w-auto sm:h-10"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Termos de Uso</h1>
              <p className="text-sm sm:text-base text-gray-600">Atualização mais recente: 06/06/2025</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8">
          <div className="prose prose-lg max-w-none space-y-6">
            <p className="text-gray-700 leading-relaxed">
              Os presentes Termos de Uso regulamentam a utilização da plataforma <strong>Camply</strong>, uma ferramenta de gestão de campanhas de marketing digital.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceitação dos Termos</h2>
              <p className="text-gray-700">
                Ao acessar e utilizar a plataforma Camply, você concorda em estar vinculado a estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não deve utilizar nossa plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descrição do Serviço</h2>
              <p className="text-gray-700 mb-3">
                A Camply é uma plataforma que oferece:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Criação e gestão de campanhas publicitárias</li>
                <li>Integração com Meta Ads (Facebook e Instagram)</li>
                <li>Geração de leads qualificados para WhatsApp</li>
                <li>Analytics e relatórios de performance</li>
                <li>Sugestões baseadas em Inteligência Artificial</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Conta de Usuário</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>3.1 Registro:</strong> Para utilizar a plataforma, você deve criar uma conta fornecendo informações precisas e atualizadas.
                </p>
                <p className="text-gray-700">
                  <strong>3.2 Responsabilidade:</strong> Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorram em sua conta.
                </p>
                <p className="text-gray-700">
                  <strong>3.3 Idade Mínima:</strong> A utilização da plataforma é restrita a maiores de 18 anos.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Uso Aceitável</h2>
              <p className="text-gray-700 mb-3">Você concorda em não utilizar a plataforma para:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Atividades ilegais ou fraudulentas</li>
                <li>Spam ou comunicações não solicitadas</li>
                <li>Violação de direitos de propriedade intelectual</li>
                <li>Interferência no funcionamento da plataforma</li>
                <li>Criação de conteúdo ofensivo, discriminatório ou prejudicial</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Planos e Pagamentos</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>5.1 Planos:</strong> Oferecemos diferentes planos de assinatura com recursos e limitações específicas.
                </p>
                <p className="text-gray-700">
                  <strong>5.2 Faturamento:</strong> Os pagamentos são processados através do Stripe de acordo com o plano escolhido.
                </p>
                <p className="text-gray-700">
                  <strong>5.3 Cancelamento:</strong> Você pode cancelar sua assinatura a qualquer momento através do painel de configurações.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Propriedade Intelectual</h2>
              <p className="text-gray-700">
                Todos os direitos de propriedade intelectual da plataforma Camply permanecem com seus respectivos proprietários. 
                Você mantém os direitos sobre o conteúdo que criar usando nossa plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitação de Responsabilidade</h2>
              <p className="text-gray-700">
                A Camply não se responsabiliza por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso da plataforma. 
                Nosso serviço é fornecido "como está" sem garantias de qualquer tipo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Modificações dos Termos</h2>
              <p className="text-gray-700">
                Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. 
                As alterações serão comunicadas através da plataforma e/ou por email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Lei Aplicável</h2>
              <p className="text-gray-700">
                Estes Termos de Uso são regidos pelas leis brasileiras. 
                Qualquer disputa será resolvida no foro da comarca de Governador Valadares, MG.
              </p>
            </section>

            <section className="border-t pt-6">
              <div className="text-center text-gray-700">
                <p className="mb-2">Em caso de dúvidas sobre estes termos, entre em contato:</p>
                <p className="mb-1">
                  📧 <a href="mailto:jefte.pcosta@gmail.com" className="text-blue-600 hover:text-blue-800 font-medium">jefte.pcosta@gmail.com</a>
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  <strong>Camply © Todos os direitos reservados.</strong>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
