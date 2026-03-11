
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Target, DollarSign } from 'lucide-react';

export default function CaseStudies() {
  const caseStudies = [
    {
      title: 'E-commerce de Moda Aumenta ROI em 340%',
      industry: 'E-commerce',
      description: 'Como uma loja online de roupas triplicou seu retorno usando segmentação avançada',
      metrics: {
        roi: '+340%',
        conversions: '+180%',
        cpa: '-45%',
        reach: '2.5M'
      },
      duration: '3 meses',
      color: 'from-pink-500 to-purple-600'
    },
    {
      title: 'Startup de Tech Reduz Custo de Aquisição em 60%',
      industry: 'Tecnologia',
      description: 'Estratégia de remarketing que revolucionou a aquisição de usuários',
      metrics: {
        roi: '+250%',
        conversions: '+120%',
        cpa: '-60%',
        reach: '1.8M'
      },
      duration: '2 meses',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Restaurante Local Dobra Vendas Online',
      industry: 'Alimentação',
      description: 'Como campanhas geolocalizadas transformaram um negócio local',
      metrics: {
        roi: '+200%',
        conversions: '+150%',
        cpa: '-30%',
        reach: '500K'
      },
      duration: '1 mês',
      color: 'from-orange-500 to-red-600'
    },
    {
      title: 'Clínica Médica Aumenta Agendamentos em 280%',
      industry: 'Saúde',
      description: 'Estratégia omnichannel para conquistar novos pacientes',
      metrics: {
        roi: '+280%',
        conversions: '+220%',
        cpa: '-35%',
        reach: '800K'
      },
      duration: '4 meses',
      color: 'from-green-500 to-teal-600'
    },
    {
      title: 'Academia Triplica Base de Alunos',
      industry: 'Fitness',
      description: 'Como campanhas sazonais geraram crescimento explosivo',
      metrics: {
        roi: '+320%',
        conversions: '+300%',
        cpa: '-50%',
        reach: '1.2M'
      },
      duration: '6 meses',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      title: 'Imobiliária Aumenta Leads Qualificados em 400%',
      industry: 'Imobiliário',
      description: 'Segmentação por perfil de comprador revoluciona vendas',
      metrics: {
        roi: '+400%',
        conversions: '+350%',
        cpa: '-40%',
        reach: '3M'
      },
      duration: '5 meses',
      color: 'from-yellow-500 to-orange-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Casos de Sucesso</h1>
        <p className="text-lg text-gray-600">
          Histórias reais de empresas que transformaram seus resultados com nossa plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {caseStudies.map((caseStudy, index) => (
          <Card key={index} className="hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className={`h-3 bg-gradient-to-r ${caseStudy.color}`}></div>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">{caseStudy.industry}</Badge>
                <span className="text-sm text-gray-500">{caseStudy.duration}</span>
              </div>
              <CardTitle className="text-xl">{caseStudy.title}</CardTitle>
              <CardDescription className="text-base">{caseStudy.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm font-medium text-gray-600">ROI</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">{caseStudy.metrics.roi}</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="w-4 h-4 text-blue-600 mr-1" />
                    <span className="text-sm font-medium text-gray-600">Conversões</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{caseStudy.metrics.conversions}</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign className="w-4 h-4 text-red-600 mr-1" />
                    <span className="text-sm font-medium text-gray-600">CPA</span>
                  </div>
                  <div className="text-lg font-bold text-red-600">{caseStudy.metrics.cpa}</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="w-4 h-4 text-purple-600 mr-1" />
                    <span className="text-sm font-medium text-gray-600">Alcance</span>
                  </div>
                  <div className="text-lg font-bold text-purple-600">{caseStudy.metrics.reach}</div>
                </div>
              </div>
              <button className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium">
                Ler Caso Completo
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
