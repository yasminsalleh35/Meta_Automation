import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UsageContract = () => {
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Contrato de Prestação de Serviços</h1>
              <p className="text-sm sm:text-base text-gray-600">Licença de Uso da Plataforma Camply</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8">
          <div className="prose prose-lg max-w-none space-y-6">
            {/* Título Principal */}
            <div className="text-center border-b pb-6 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                CONTRATO DE PRESTAÇÃO DE SERVIÇOS E LICENÇA DE USO DA PLATAFORMA CAMPLY
              </h2>
            </div>

            {/* Partes */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 leading-relaxed mb-3">
                Pelo presente instrumento particular, de um lado:
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>CAMPLY GROUP</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº{' '}
                <span className="font-mono font-semibold bg-gray-200 px-2 py-0.5 rounded">63.626.513/0001-22</span>, 
                doravante denominada <strong>CONTRATADA</strong>;
              </p>
              <p className="text-gray-700 leading-relaxed mb-3">
                e, de outro lado, o <strong>CLIENTE</strong>, pessoa física ou jurídica devidamente identificada no momento da contratação, 
                doravante denominado <strong>CONTRATANTE</strong>;
              </p>
              <p className="text-gray-700 leading-relaxed">
                têm entre si justo e contratado o que segue:
              </p>
            </section>

            {/* Cláusula 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">CLÁUSULA 1 – DO OBJETO</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>1.1.</strong> O presente contrato tem como objeto a licença de uso da plataforma Camply, software no modelo SaaS (Software as a Service), 
                  destinada à criação, gestão, otimização e acompanhamento de campanhas de anúncios digitais, bem como o fornecimento de suporte estratégico e 
                  operacional conforme os termos deste contrato.
                </p>
                <p className="text-gray-700">
                  <strong>1.2.</strong> A plataforma Camply atua como uma solução automatizada de gestão de anúncios, realizando otimizações contínuas com base em dados, 
                  inteligência artificial e boas práticas de tráfego pago.
                </p>
              </div>
            </section>

            {/* Cláusula 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">CLÁUSULA 2 – DO PLANO CONTRATADO E PRAZO</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>2.1.</strong> O CONTRATANTE adere ao <strong>PLANO ANUAL (12 MESES)</strong> da plataforma Camply.
                </p>
                <p className="text-gray-700">
                  <strong>2.2.</strong> O prazo de vigência deste contrato é de <strong>12 (doze) meses</strong>, contados a partir da data da confirmação do pagamento.
                </p>
                <p className="text-gray-700">
                  <strong>2.3.</strong> A contratação é realizada exclusivamente no formato anual, não havendo modalidade mensal avulsa para este plano.
                </p>
              </div>
            </section>

            {/* Cláusula 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">CLÁUSULA 3 – DO VALOR E FORMA DE PAGAMENTO</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>3.1.</strong> Pelo uso da plataforma e serviços descritos neste contrato, o CONTRATANTE pagará o valor total de:
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <span className="text-2xl font-bold text-green-700">R$ 2.499,00</span>
                  <p className="text-green-600 text-sm mt-1">(dois mil quatrocentos e noventa e nove reais)</p>
                </div>
                <p className="text-gray-700">
                  <strong>3.2.</strong> O pagamento poderá ser realizado de forma parcelada em:
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <span className="text-xl font-bold text-blue-700">12 (doze) parcelas de R$ 208,25</span>
                  <p className="text-blue-600 text-sm mt-1">(duzentos e oito reais e vinte e cinco centavos)</p>
                </div>
                <p className="text-gray-700">
                  <strong>3.3.</strong> O valor contratado refere-se exclusivamente à licença da plataforma e ao suporte, não incluindo valores de investimento em anúncios, 
                  que são de responsabilidade direta do CONTRATANTE junto às plataformas de mídia (Meta, Google, TikTok, etc.).
                </p>
              </div>
            </section>

            {/* Cláusula 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">CLÁUSULA 4 – DOS SERVIÇOS INCLUSOS</h2>
              <p className="text-gray-700 mb-3">
                <strong>4.1.</strong> Estão inclusos no plano contratado:
              </p>
              <ul className="list-none space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">a)</span>
                  <span>Acesso completo à plataforma Camply durante o período de vigência;</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">b)</span>
                  <span>Criação, gerenciamento e otimização automática das campanhas realizadas através da plataforma;</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">c)</span>
                  <div>
                    <span>Suporte via WhatsApp, destinado a:</span>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Dúvidas sobre usabilidade da plataforma;</li>
                      <li>Orientações estratégicas;</li>
                      <li>Recomendações de campanhas, públicos, criativos e investimentos;</li>
                    </ul>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">d)</span>
                  <span>Acompanhamento e ajustes estratégicos com base no desempenho das campanhas.</span>
                </li>
              </ul>
            </section>

            {/* Cláusula 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">CLÁUSULA 5 – DO SUPORTE</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>5.1.</strong> O suporte será prestado em horário comercial, de segunda a sexta-feira, exceto feriados nacionais, no horário das{' '}
                  <strong className="bg-yellow-100 px-1 rounded">09h às 18h</strong>.
                </p>
                <p className="text-gray-700">
                  <strong>5.2.</strong> O suporte será realizado prioritariamente por WhatsApp, podendo, a critério da CONTRATADA, ser complementado por outros canais.
                </p>
              </div>
            </section>

            {/* Cláusula 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">CLÁUSULA 6 – GARANTIA DE CONTINUIDADE DO SERVIÇO</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>6.1.</strong> A CONTRATADA compromete-se a manter a plataforma Camply em pleno funcionamento, adotando boas práticas de manutenção, segurança e estabilidade.
                </p>
                <p className="text-gray-700">
                  <strong>6.2.</strong> Em caso de indisponibilidade, falha técnica grave ou interrupção do funcionamento da plataforma, que impeça a execução das campanhas contratadas, a CONTRATADA garante que:
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 ml-4">
                  <p className="text-gray-700">
                    Um especialista em gestão de tráfego assumirá temporariamente a operação e otimização das campanhas do CONTRATANTE, exercendo a função até o completo restabelecimento 
                    do funcionamento da plataforma Camply, <strong>sem custo adicional</strong>.
                  </p>
                </div>
                <p className="text-gray-700">
                  <strong>6.3.</strong> Essa medida tem como objetivo garantir a continuidade dos resultados e a não interrupção das estratégias de anúncios do CONTRATANTE.
                </p>
              </div>
            </section>

            {/* Cláusula 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">CLÁUSULA 7 – DAS RESPONSABILIDADES DO CONTRATANTE</h2>
              <p className="text-gray-700 mb-3">
                <strong>7.1.</strong> O CONTRATANTE é responsável por:
              </p>
              <ul className="list-none space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">a)</span>
                  <span>Fornecer informações corretas sobre seu negócio, produtos ou serviços;</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">b)</span>
                  <span>Cumprir as políticas das plataformas de anúncios utilizadas;</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">c)</span>
                  <span>Realizar os pagamentos nas datas acordadas;</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">d)</span>
                  <span>Ser responsável pelos valores investidos diretamente em mídia paga.</span>
                </li>
              </ul>
            </section>

            {/* Cláusula 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">CLÁUSULA 8 – DA NÃO GARANTIA DE RESULTADOS ESPECÍFICOS</h2>
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>8.1.</strong> A CONTRATADA não garante resultados financeiros específicos, como volume exato de vendas ou leads, uma vez que tais resultados dependem de fatores externos, 
                  incluindo mercado, produto, oferta, investimento e comportamento do público.
                </p>
                <p className="text-gray-700">
                  <strong>8.2.</strong> A CONTRATADA compromete-se, entretanto, a aplicar as melhores práticas de otimização e estratégia, dentro das possibilidades técnicas da plataforma.
                </p>
              </div>
            </section>

            {/* Cláusula 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">CLÁUSULA 9 – DA RESCISÃO</h2>
              <p className="text-gray-700">
                <strong>9.1.</strong> Por se tratar de plano anual com pagamento parcelado, a rescisão antecipada não isenta o CONTRATANTE do pagamento das parcelas restantes, 
                salvo acordo formal entre as partes.
              </p>
            </section>

            {/* Cláusula 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">CLÁUSULA 10 – DO FORO</h2>
              <p className="text-gray-700">
                <strong>10.1.</strong> Para dirimir quaisquer dúvidas oriundas deste contrato, as partes elegem o foro da comarca do domicílio da CONTRATADA, 
                renunciando a qualquer outro, por mais privilegiado que seja.
              </p>
            </section>

            {/* Fechamento */}
            <section className="border-t pt-6">
              <div className="text-center text-gray-700">
                <p className="mb-4 italic">
                  E, por estarem de acordo, as partes aceitam os termos acima no momento da contratação digital.
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

export default UsageContract;
