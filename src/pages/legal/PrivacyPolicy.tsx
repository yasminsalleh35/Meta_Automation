
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicy = () => {
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Política de Privacidade</h1>
              <p className="text-sm sm:text-base text-gray-600">Atualização mais recente: 06/06/2025</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8">
          <div className="prose prose-lg max-w-none space-y-6">
            <p className="text-gray-700 leading-relaxed">
              A <strong>Camply</strong> respeita sua privacidade e está comprometida em proteger seus dados pessoais. 
              Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Informações que Coletamos</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>1.1 Dados de Cadastro:</strong> Nome, email, telefone e informações de perfil fornecidas por você.
                </p>
                <p className="text-gray-700">
                  <strong>1.2 Dados de Uso:</strong> Informações sobre como você utiliza nossa plataforma, incluindo campanhas criadas e métricas de performance.
                </p>
                <p className="text-gray-700">
                  <strong>1.3 Dados Técnicos:</strong> Endereço IP, tipo de navegador, dispositivo e dados de conexão.
                </p>
                <p className="text-gray-700">
                  <strong>1.4 Cookies:</strong> Utilizamos cookies para melhorar sua experiência e personalizar nossos serviços.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Como Utilizamos suas Informações</h2>
              <p className="text-gray-700 mb-3">Utilizamos seus dados para:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Processar suas campanhas publicitárias</li>
                <li>Enviar comunicações importantes sobre sua conta</li>
                <li>Oferecer suporte técnico</li>
                <li>Personalizar sua experiência na plataforma</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Compartilhamento de Dados</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>3.1 Com Terceiros:</strong> Compartilhamos dados apenas quando necessário para:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Integração com Meta Ads (Facebook e Instagram)</li>
                  <li>Processamento de pagamentos (Stripe)</li>
                  <li>Serviços de análise e otimização</li>
                  <li>Cumprimento de obrigações legais</li>
                </ul>
                <p className="text-gray-700">
                  <strong>3.2 Nunca Vendemos:</strong> Não vendemos, alugamos ou comercializamos seus dados pessoais.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Segurança dos Dados</h2>
              <p className="text-gray-700 mb-3">Implementamos medidas de segurança incluindo:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Controles de acesso rigorosos</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups regulares e seguros</li>
                <li>Certificação SSL/TLS em todas as comunicações</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Seus Direitos</h2>
              <p className="text-gray-700 mb-3">Você tem direito a:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir informações incorretas</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Portabilidade de dados</li>
                <li>Revogar consentimentos</li>
                <li>Ser informado sobre uso de seus dados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Retenção de Dados</h2>
              <p className="text-gray-700">
                Mantemos seus dados pelo tempo necessário para fornecer nossos serviços e cumprir obrigações legais. 
                Dados de campanhas são mantidos por até 5 anos para fins de análise e conformidade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies e Tecnologias Similares</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>7.1 Tipos de Cookies:</strong> Utilizamos cookies essenciais, de performance e de personalização.
                </p>
                <p className="text-gray-700">
                  <strong>7.2 Controle:</strong> Você pode gerenciar cookies através das configurações do seu navegador.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Transferências Internacionais</h2>
              <p className="text-gray-700">
                Alguns de nossos provedores de serviços podem estar localizados fora do Brasil. 
                Garantimos que todas as transferências sejam feitas com adequadas salvaguardas de proteção.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Menores de Idade</h2>
              <p className="text-gray-700">
                Nossos serviços não se destinam a menores de 18 anos. Não coletamos intencionalmente 
                dados de menores de idade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Alterações nesta Política</h2>
              <p className="text-gray-700">
                Podemos atualizar esta Política de Privacidade periodicamente. 
                Notificaremos sobre mudanças significativas através da plataforma ou por email.
              </p>
            </section>

            <section className="border-t pt-6">
              <div className="text-center text-gray-700">
                <p className="mb-2">Para exercer seus direitos ou esclarecer dúvidas:</p>
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

export default PrivacyPolicy;
