import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const IAFAQSection: React.FC = () => {
  const faqs = [
    {
      question: 'A Camply substitui um gestor de tráfego?',
      answer: 'A Camply oferece uma alternativa baseada em IA para quem não pode ou não quer contratar um gestor tradicional. Ela faz o papel técnico de criação, gestão e otimização de campanhas. Gestores continuam sendo ótimos para estratégias mais complexas — mas para a maioria dos pequenos negócios, a Camply resolve muito bem.',
    },
    {
      question: 'Eu preciso entender de anúncios para usar?',
      answer: 'Não. Você só precisa saber o que vende, para quem vende e quanto deseja investir. A Camply traduz isso em campanhas prontas para rodar no Meta Ads.',
    },
    {
      question: 'Em quanto tempo uma campanha fica pronta?',
      answer: 'Normalmente, em poucos minutos. Depois da configuração inicial, a Camply publica o anúncio e começa a otimizar automaticamente.',
    },
    {
      question: 'A Camply funciona para qualquer nicho?',
      answer: 'Funciona para a maioria dos negócios que podem anunciar no Meta: prestadores de serviço, negócios locais, infoprodutos, profissionais liberais e mais. Respeitamos todas as políticas de anúncios da plataforma.',
    },
    {
      question: 'Posso cancelar quando quiser?',
      answer: 'Sim. Você não fica preso em contrato. Se não quiser continuar, é só cancelar a assinatura.',
    },
    {
      question: 'Meus dados estão seguros?',
      answer: 'Sim. Toda a comunicação com a Meta é feita via API oficial, respeitando padrões de segurança e privacidade.',
    },
  ];

  return (
    <section className="bg-camply-green-light py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-camply-dark mb-4">
              Perguntas Frequentes
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white rounded-2xl px-6 border-none shadow-sm"
              >
                <AccordionTrigger className="text-left text-camply-dark font-semibold hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-camply-dark/70 pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
