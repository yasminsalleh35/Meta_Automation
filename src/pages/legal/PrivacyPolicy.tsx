
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CookiePreferencesLink } from '@/components/legal/CookieConsentBanner';

// Audit LGL-01: conteúdo revisado a partir do que o código realmente faz
// (operadores, categorias de dados, retenção, direitos). Base legal por finalidade,
// identificação do Encarregado e e-mail corporativo dependem do cliente/jurídico —
// ver docs/legal/client-legal-checklist.md.

const PROCESSORS: Array<{ name: string; purpose: string; location: string }> = [
  {
    name: 'Supabase',
    purpose: 'Banco de dados, autenticação, armazenamento de arquivos e funções de servidor',
    location: 'Banco de dados em São Paulo (Brasil); funções de servidor podem ser executadas em outros países',
  },
  {
    name: 'Netlify',
    purpose: 'Hospedagem do site e da aplicação web',
    location: 'Estados Unidos e rede global de distribuição',
  },
  {
    name: 'Meta Platforms (Facebook, Instagram e WhatsApp)',
    purpose: 'Conexão da sua conta, leitura de ativos (contas de anúncio, páginas, perfis, números de WhatsApp), criação e gestão de campanhas e coleta de métricas',
    location: 'Estados Unidos e outros países',
  },
  {
    name: 'Pagar.me',
    purpose: 'Processamento de pagamentos e assinaturas com cartão',
    location: 'Brasil',
  },
  {
    name: 'Asaas',
    purpose: 'Processamento de pagamentos e cobranças',
    location: 'Brasil',
  },
  {
    name: 'DeepSeek e OpenAI',
    purpose: 'Inteligência artificial para gerar perfis de campanha, sugestões, avaliações de métricas, relatórios e qualificação de respostas de formulários',
    location: 'DeepSeek: China; OpenAI: Estados Unidos',
  },
  {
    name: 'Resend',
    purpose: 'Envio de e-mails transacionais (confirmação de cadastro, criação de conta, pagamentos)',
    location: 'Estados Unidos',
  },
  {
    name: 'Mapbox',
    purpose: 'Mapas e busca de localizações para segmentação geográfica das campanhas',
    location: 'Estados Unidos',
  },
];

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
              <p className="text-sm sm:text-base text-gray-600">Atualização mais recente: 08/11/2026</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8">
          <div className="prose prose-lg max-w-none space-y-6">
            <p className="text-gray-700 leading-relaxed">
              A <strong>Camply</strong> respeita sua privacidade e trata dados pessoais de acordo com a
              Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD). Esta Política explica quais dados
              coletamos, para que os usamos, com quem os compartilhamos, por quanto tempo os guardamos e
              como você pode exercer seus direitos.
            </p>
            <p className="text-gray-700 leading-relaxed">
              A plataforma Camply é operada por <strong>CAMPLY GROUP</strong>, inscrita no CNPJ sob o
              nº 63.626.513/0001-22, conforme o{' '}
              <Link to="/legal/contrato" className="text-blue-600 hover:text-blue-800">Contrato de Uso</Link>.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Dados que Coletamos</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>1.1 Dados de conta:</strong> nome, e-mail, senha (armazenada de forma criptografada),
                  telefone/WhatsApp e informações de perfil fornecidas por você.
                </p>
                <p className="text-gray-700">
                  <strong>1.2 Dados do seu negócio:</strong> nome do negócio, descrição, produtos ou especialidades,
                  público-alvo, objetivos e demais informações que você cadastra para criar campanhas.
                </p>
                <p className="text-gray-700">
                  <strong>1.3 Dados da sua conta Meta:</strong> ao conectar Facebook/Instagram, recebemos um token de
                  acesso autorizado por você e informações dos seus ativos (contas de anúncio, páginas, perfis do
                  Instagram, contas e números do WhatsApp Business). Não recebemos sua senha do Facebook e não temos
                  acesso ao conteúdo das conversas de WhatsApp entre você e seus clientes ou pacientes.
                </p>
                <p className="text-gray-700">
                  <strong>1.4 Dados de campanhas:</strong> configurações, orçamento, segmentação, textos, públicos e as
                  métricas de desempenho retornadas pela Meta.
                </p>
                <p className="text-gray-700">
                  <strong>1.5 Arquivos enviados:</strong> imagens e vídeos que você envia para usar nos anúncios. Esses
                  arquivos ficam em armazenamento acessível por link, pois são publicados nas plataformas de anúncio;
                  não envie arquivos que contenham dados pessoais sensíveis.
                </p>
                <p className="text-gray-700">
                  <strong>1.6 Dados de pagamento:</strong> dados de cobrança (como nome, CPF/CNPJ, endereço e telefone) e
                  o histórico de assinaturas. Os dados do cartão são digitados e processados diretamente pelos
                  processadores de pagamento; a Camply não armazena o número completo do cartão.
                </p>
                <p className="text-gray-700">
                  <strong>1.7 Formulários e quizzes públicos:</strong> quando você responde a um formulário ou quiz da
                  Camply, coletamos nome, WhatsApp, e-mail, nome da empresa, suas respostas, a origem da visita
                  (parâmetros UTM e página de referência) e o tipo de dispositivo, mediante o seu consentimento.
                </p>
                <p className="text-gray-700">
                  <strong>1.8 Dados técnicos e de segurança:</strong> endereço IP, data e hora de acesso, tipo de
                  navegador e dispositivo e registros técnicos (logs) de funcionamento.
                </p>
                <p className="text-gray-700">
                  <strong>1.9 Atendimento:</strong> mensagens e informações enviadas em tickets de suporte.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Para que Usamos seus Dados</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Criar e manter sua conta e autenticar seu acesso</li>
                <li>Conectar sua conta Meta e criar, publicar, pausar e acompanhar suas campanhas</li>
                <li>Gerar sugestões, perfis de campanha, avaliações de métricas e relatórios com inteligência artificial</li>
                <li>Processar pagamentos, assinaturas e emitir comunicações de cobrança</li>
                <li>Enviar e-mails transacionais sobre sua conta (confirmação de cadastro, pagamentos, avisos importantes)</li>
                <li>Responder a formulários/quizzes, qualificar o contato e retornar com uma proposta comercial</li>
                <li>Prestar suporte e responder às suas solicitações</li>
                <li>Garantir a segurança da plataforma, prevenir fraudes e abusos (ex.: limites de requisições e filtros anti-spam)</li>
                <li>Cumprir obrigações legais, regulatórias e fiscais e exercer direitos em processos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Uso de Inteligência Artificial</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  Para gerar sugestões e análises, a Camply envia a provedores de IA (atualmente DeepSeek e/ou OpenAI)
                  informações do seu negócio (como descrição, especialidades, público e objetivos) e dados de
                  desempenho das suas campanhas. No caso de formulários/quizzes, as respostas enviadas são analisadas
                  por IA para qualificar o contato.
                </p>
                <p className="text-gray-700">
                  As respostas geradas pela IA são sugestões: você decide o que aplicar nas suas campanhas. A IA não
                  toma decisões que produzam efeitos jurídicos sobre você. Evite incluir dados pessoais de terceiros
                  ou dados sensíveis (por exemplo, dados de saúde de pacientes) nos campos de texto livre.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Compartilhamento de Dados</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>4.1 Operadores e parceiros:</strong> compartilhamos dados apenas na medida necessária para
                  prestar o serviço, com os seguintes fornecedores:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-700 border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2 border-b">Fornecedor</th>
                        <th className="text-left p-2 border-b">Finalidade</th>
                        <th className="text-left p-2 border-b">Localização</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PROCESSORS.map((p) => (
                        <tr key={p.name} className="align-top">
                          <td className="p-2 border-b font-medium">{p.name}</td>
                          <td className="p-2 border-b">{p.purpose}</td>
                          <td className="p-2 border-b">{p.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-gray-700">
                  <strong>4.2 Meta:</strong> as campanhas que você cria são publicadas na Meta, que trata os dados dos
                  anúncios e das pessoas que interagem com eles de acordo com as políticas próprias da Meta.
                </p>
                <p className="text-gray-700">
                  <strong>4.3 Autoridades:</strong> podemos compartilhar dados quando exigido por lei, ordem judicial ou
                  requisição de autoridade competente.
                </p>
                <p className="text-gray-700">
                  <strong>4.4 Nunca vendemos:</strong> não vendemos, alugamos ou comercializamos seus dados pessoais.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Transferência Internacional de Dados</h2>
              <p className="text-gray-700">
                Nosso banco de dados principal fica no Brasil (São Paulo). Porém, alguns fornecedores listados acima
                — hospedagem, e-mail, mapas, Meta e provedores de IA — processam dados nos Estados Unidos, na China ou
                em outros países. Essas transferências ocorrem para executar o serviço que você contratou ou solicitou
                e são feitas com fornecedores que adotam medidas de segurança compatíveis com a LGPD (art. 33).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Segurança dos Dados</h2>
              <p className="text-gray-700 mb-3">Adotamos medidas técnicas e administrativas, incluindo:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Comunicação criptografada (HTTPS/TLS)</li>
                <li>Controle de acesso por usuário no banco de dados (cada cliente acessa apenas os próprios dados)</li>
                <li>Limites de requisições e de envio de formulários, com filtros anti-spam</li>
                <li>Backups do banco de dados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Por Quanto Tempo Guardamos</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>
                  <strong>Conta e dados da plataforma:</strong> enquanto sua conta estiver ativa. Ao solicitar a exclusão,
                  a conta é desativada imediatamente e os dados são excluídos definitivamente após um período de
                  carência de 30 dias (em que a exclusão ainda pode ser revertida a seu pedido).
                </li>
                <li>
                  <strong>Respostas de formulários e quizzes:</strong> até 2 anos após o envio; depois disso, os dados
                  pessoais são anonimizados automaticamente.
                </li>
                <li>
                  <strong>Dados de pagamento e fiscais:</strong> pelo prazo exigido pela legislação fiscal e para defesa
                  em eventuais processos, mesmo após a exclusão da conta.
                </li>
                <li>
                  <strong>Registros de acesso:</strong> pelo prazo mínimo exigido pelo Marco Civil da Internet
                  (Lei nº 12.965/2014).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Seus Direitos e Como Exercê-los</h2>
              <p className="text-gray-700 mb-3">Nos termos do art. 18 da LGPD, você pode:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Confirmar se tratamos seus dados e acessá-los</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>Solicitar a portabilidade, anonimização, bloqueio ou eliminação de dados</li>
                <li>Saber com quem compartilhamos seus dados</li>
                <li>Revogar o consentimento e ser informado sobre as consequências de não fornecê-lo</li>
                <li>Apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD)</li>
              </ul>
              <div className="space-y-3 mt-3">
                <p className="text-gray-700">
                  <strong>Pela plataforma:</strong> em <strong>Configurações</strong>, use <strong>"Exportar meus dados"</strong>{' '}
                  para baixar uma cópia dos seus dados e <strong>"Excluir minha conta"</strong> para solicitar a exclusão.
                  Dados cadastrais podem ser corrigidos diretamente nas telas de perfil e configurações. Você também pode
                  desconectar sua conta Meta a qualquer momento.
                </p>
                <p className="text-gray-700">
                  <strong>Por e-mail:</strong> para os demais pedidos (ou se você não tem conta, como quem respondeu a um
                  quiz), escreva para o contato indicado ao final desta página. Podemos pedir informações para confirmar
                  sua identidade antes de atender.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Cookies e Tecnologias Similares</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>9.1 Essenciais:</strong> usamos armazenamento local do navegador para manter sua sessão de
                  login, guardar preferências e o registro da sua escolha sobre cookies. Eles são necessários para o
                  funcionamento do site.
                </p>
                <p className="text-gray-700">
                  <strong>9.2 Análise e marketing:</strong> só são ativados se você autorizar no aviso de cookies.
                  Atualmente a Camply não utiliza ferramentas de análise ou pixels de anúncio no site.
                </p>
                <p className="text-gray-700">
                  <strong>9.3 Conteúdo de terceiros:</strong> algumas páginas carregam fontes (Google Fonts) e vídeos
                  incorporados do YouTube em modo de privacidade aprimorada; esses serviços podem receber seu endereço
                  IP ao exibir o conteúdo.
                </p>
                <p className="text-gray-700">
                  <strong>9.4 Controle:</strong> você pode alterar sua escolha a qualquer momento em{' '}
                  <CookiePreferencesLink className="text-blue-600 hover:text-blue-800 underline" />.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Menores de Idade</h2>
              <p className="text-gray-700">
                Nossos serviços não se destinam a menores de 18 anos. Não coletamos intencionalmente
                dados de menores de idade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Alterações nesta Política</h2>
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
