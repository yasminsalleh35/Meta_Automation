
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play } from 'lucide-react';

export default function Videos() {
  const videoCategories = [
    {
      title: 'Primeiros Passos',
      videos: [
        { title: 'Como criar sua primeira conta', duration: '5:30', level: 'Iniciante' },
        { title: 'Configurando seu perfil empresarial', duration: '8:15', level: 'Iniciante' },
        { title: 'Tour pela plataforma', duration: '12:45', level: 'Iniciante' },
      ]
    },
    {
      title: 'Criando Campanhas',
      videos: [
        { title: 'Sua primeira campanha do zero', duration: '15:20', level: 'Iniciante' },
        { title: 'Definindo público-alvo eficaz', duration: '18:30', level: 'Intermediário' },
        { title: 'Criando anúncios que convertem', duration: '22:10', level: 'Intermediário' },
        { title: 'Estratégias avançadas de segmentação', duration: '25:45', level: 'Avançado' },
      ]
    },
    {
      title: 'Integrações',
      videos: [
        { title: 'Conectando Google Ads', duration: '10:30', level: 'Intermediário' },
        { title: 'Integração com Meta Ads', duration: '12:15', level: 'Intermediário' },
        { title: 'Sincronização de dados', duration: '8:45', level: 'Avançado' },
      ]
    },
    {
      title: 'Análise e Otimização',
      videos: [
        { title: 'Interpretando métricas', duration: '16:20', level: 'Intermediário' },
        { title: 'Otimizando campanhas existentes', duration: '20:30', level: 'Avançado' },
        { title: 'Relatórios personalizados', duration: '14:15', level: 'Avançado' },
      ]
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Iniciante': return 'bg-green-100 text-green-800';
      case 'Intermediário': return 'bg-yellow-100 text-yellow-800';
      case 'Avançado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tutoriais em Vídeo</h1>
        <p className="text-lg text-gray-600">
          Aprenda através de vídeos práticos e didáticos organizados por categoria
        </p>
      </div>

      <div className="space-y-8">
        {videoCategories.map((category) => (
          <div key={category.title}>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{category.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.videos.map((video, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getLevelColor(video.level)}>{video.level}</Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {video.duration}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{video.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center bg-gray-100 rounded-lg h-32 mb-4">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Assistir Vídeo
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
