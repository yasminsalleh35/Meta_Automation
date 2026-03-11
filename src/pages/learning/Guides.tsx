
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, Clock } from 'lucide-react';

export default function Guides() {
  const guides = [
    {
      title: 'Guia Completo de Configuração Inicial',
      description: 'Tudo que você precisa saber para começar na plataforma',
      category: 'Iniciante',
      readTime: '15 min',
      downloadable: true,
    },
    {
      title: 'Manual de Criação de Campanhas Eficazes',
      description: 'Estratégias comprovadas para campanhas de alto desempenho',
      category: 'Intermediário',
      readTime: '25 min',
      downloadable: true,
    },
    {
      title: 'Checklist de Otimização de Campanhas',
      description: 'Lista completa para maximizar seus resultados',
      category: 'Intermediário',
      readTime: '10 min',
      downloadable: true,
    },
    {
      title: 'Guia Avançado de Segmentação',
      description: 'Técnicas avançadas para alcançar o público certo',
      category: 'Avançado',
      readTime: '30 min',
      downloadable: true,
    },
    {
      title: 'Manual de Integrações',
      description: 'Como conectar e sincronizar todas suas ferramentas',
      category: 'Intermediário',
      readTime: '20 min',
      downloadable: true,
    },
    {
      title: 'Guia de Análise de Métricas',
      description: 'Como interpretar dados e tomar decisões baseadas em dados',
      category: 'Avançado',
      readTime: '35 min',
      downloadable: true,
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Iniciante': return 'bg-green-100 text-green-800';
      case 'Intermediário': return 'bg-yellow-100 text-yellow-800';
      case 'Avançado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Guias Práticos</h1>
        <p className="text-lg text-gray-600">
          Manuais detalhados e checklists para dominar a plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guides.map((guide, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge className={getCategoryColor(guide.category)}>{guide.category}</Badge>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {guide.readTime}
                </div>
              </div>
              <CardTitle className="text-lg">{guide.title}</CardTitle>
              <CardDescription>{guide.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg h-24 mb-4">
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
              <div className="space-y-2">
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Ler Guia
                </button>
                {guide.downloadable && (
                  <button className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
