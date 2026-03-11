
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState('');

  const faqCategories = [
    {
      category: 'Primeiros Passos',
      color: 'bg-green-100 text-green-800',
      questions: [
        {
          question: 'Como criar minha primeira conta?',
          answer: 'Para criar sua conta, clique no botão "Cadastrar" no topo da página, preencha seus dados básicos e confirme seu email. O processo leva menos de 2 minutos.'
        },
        {
          question: 'Qual plano escolher para começar?',
          answer: 'Recomendamos começar com o plano Básico se você é novo em marketing digital. Para empresas com mais experiência, o plano Pro oferece recursos avançados.'
        },
        {
          question: 'Preciso de conhecimento técnico?',
          answer: 'Não! Nossa plataforma foi desenvolvida para ser intuitiva. Fornecemos guias passo a passo e nossa equipe de suporte está sempre disponível.'
        }
      ]
    },
    {
      category: 'Campanhas',
      color: 'bg-blue-100 text-blue-800',
      questions: [
        {
          question: 'Como criar minha primeira campanha?',
          answer: 'Vá para "Campanhas" > "Nova Campanha", escolha seu objetivo, defina seu público-alvo, crie seus anúncios e configure seu orçamento. Nosso assistente guiará você em cada etapa.'
        },
        {
          question: 'Quanto devo investir em uma campanha?',
          answer: 'Recomendamos começar com R$ 10-20 por dia para testar. Você pode aumentar o orçamento gradualmente conforme vê os resultados.'
        },
        {
          question: 'Como otimizar campanhas com baixo desempenho?',
          answer: 'Analise as métricas, teste diferentes criativos, ajuste a segmentação de público e revise suas palavras-chave. Nossos relatórios automáticos sugerem otimizações.'
        }
      ]
    },
    {
      category: 'Integrações',
      color: 'bg-purple-100 text-purple-800',
      questions: [
        {
          question: 'Como conectar minha conta do Google Ads?',
          answer: 'Vá em "Configurações" > "Integrações" > "Google Ads", clique em "Conectar" e autorize o acesso. A sincronização é automática e segura.'
        },
        {
          question: 'Posso integrar com Facebook/Meta Ads?',
          answer: 'Sim! Suportamos integração completa com Meta Ads. Vá em "Integrações" e siga o processo de conexão. Seus dados serão sincronizados em tempo real.'
        },
        {
          question: 'Meus dados estão seguros?',
          answer: 'Absolutamente. Usamos criptografia de ponta e seguimos rigorosos protocolos de segurança. Nunca compartilhamos seus dados com terceiros.'
        }
      ]
    },
    {
      category: 'Faturamento',
      color: 'bg-yellow-100 text-yellow-800',
      questions: [
        {
          question: 'Como funciona a cobrança?',
          answer: 'Cobramos mensalmente via cartão de crédito. Você pode cancelar a qualquer momento sem multas ou taxas de cancelamento.'
        },
        {
          question: 'Posso mudar de plano?',
          answer: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças são aplicadas no próximo ciclo de cobrança.'
        },
        {
          question: 'Há período de teste gratuito?',
          answer: 'Sim! Oferecemos 14 dias grátis para você testar todos os recursos da plataforma sem compromisso.'
        }
      ]
    },
    {
      category: 'Relatórios',
      color: 'bg-red-100 text-red-800',
      questions: [
        {
          question: 'Como interpretar os relatórios?',
          answer: 'Cada métrica tem uma explicação detalhada. Foque em ROI, CPA e taxa de conversão. Nossos vídeos tutoriais explicam cada indicador.'
        },
        {
          question: 'Posso exportar os dados?',
          answer: 'Sim! Você pode exportar relatórios em PDF, Excel ou CSV. Vá em "Relatórios" e clique no ícone de download.'
        },
        {
          question: 'Com que frequência os dados são atualizados?',
          answer: 'Os dados são atualizados em tempo real para a maioria das métricas. Algumas plataformas podem ter delay de até 24 horas.'
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Perguntas Frequentes</h1>
        <p className="text-lg text-gray-600 mb-6">
          Encontre respostas rápidas para as dúvidas mais comuns
        </p>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar nas perguntas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-8">
        {filteredCategories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <div className="flex items-center gap-3 mb-4">
              <Badge className={category.color}>{category.category}</Badge>
              <span className="text-sm text-gray-500">
                {category.questions.length} pergunta{category.questions.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <Accordion type="single" collapsible className="space-y-2">
              {category.questions.map((faq, questionIndex) => (
                <AccordionItem 
                  key={questionIndex} 
                  value={`${categoryIndex}-${questionIndex}`}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Nenhuma pergunta encontrada para "{searchTerm}"
          </p>
          <p className="text-gray-400 mt-2">
            Tente usar termos diferentes ou entre em contato conosco
          </p>
        </div>
      )}

      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Não encontrou sua resposta?</h2>
        <p className="text-gray-600 mb-6">
          Nossa equipe de suporte está pronta para ajudar você
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Abrir Ticket de Suporte
          </button>
          <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
            Chat ao Vivo
          </button>
        </div>
      </div>
    </div>
  );
}
