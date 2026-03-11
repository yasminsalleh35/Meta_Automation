
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, BookOpen, Users, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LearningCenter() {
  const learningCategories = [
    {
      title: 'Tutoriais em Vídeo',
      description: 'Aprenda através de vídeos práticos e didáticos',
      icon: Play,
      link: '/learning/videos',
      color: 'bg-blue-500',
    },
    {
      title: 'Guias Práticos',
      description: 'Manuais passo a passo para usar a plataforma',
      icon: BookOpen,
      link: '/learning/guides',
      color: 'bg-green-500',
    },
    {
      title: 'Casos de Sucesso',
      description: 'Histórias reais de campanhas bem-sucedidas',
      icon: Users,
      link: '/learning/case-studies',
      color: 'bg-purple-500',
    },
    {
      title: 'FAQ',
      description: 'Respostas para as perguntas mais frequentes',
      icon: HelpCircle,
      link: '/learning/faq',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Centro de Aprendizado</h1>
        <p className="text-lg text-gray-600">
          Domine todas as funcionalidades da plataforma com nossos recursos educativos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {learningCategories.map((category) => (
          <Card key={category.title} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <category.icon className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={category.link}>
                <Button className="w-full">Acessar</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Precisa de ajuda personalizada?</h2>
          <p className="text-gray-600 mb-6">
            Nossa equipe está pronta para ajudar você a maximizar seus resultados
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Falar com Especialista
          </Button>
        </div>
      </div>
    </div>
  );
}
