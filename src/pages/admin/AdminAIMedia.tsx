
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Image, Play, Search, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AdminAIMedia = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const stats = [
    { label: 'Mídias Geradas', value: '3,456', color: 'text-blue-600' },
    { label: 'Imagens', value: '2,890', color: 'text-green-600' },
    { label: 'Vídeos', value: '566', color: 'text-purple-600' },
    { label: 'Custo Total', value: 'R$ 1,234', color: 'text-orange-600' }
  ];

  const mediaItems = [
    {
      id: '1',
      type: 'image',
      title: 'Promoção Restaurante',
      user: 'João Silva',
      prompt: 'Uma imagem promocional de um restaurante...',
      status: 'completed',
      cost: 'R$ 2.50',
      created: '2024-01-20 14:30'
    },
    {
      id: '2',
      type: 'video',
      title: 'Academia Fitness',
      user: 'Maria Santos',
      prompt: 'Vídeo promocional para academia...',
      status: 'processing',
      cost: 'R$ 15.00',
      created: '2024-01-20 14:25'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processando</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4" />;
      default:
        return <Image className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">IA para Mídia</h1>
        <p className="text-gray-600 mt-2">
          Monitore a geração de conteúdo visual com IA
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Image className="w-5 h-5" />
            <span>Mídias Geradas</span>
          </CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar mídias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="image">Imagens</SelectItem>
                <SelectItem value="video">Vídeos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Título</th>
                  <th className="text-left p-3">Usuário</th>
                  <th className="text-left p-3">Prompt</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Custo</th>
                  <th className="text-left p-3">Criado</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {mediaItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(item.type)}
                        <span className="capitalize">{item.type}</span>
                      </div>
                    </td>
                    <td className="p-3 font-medium">{item.title}</td>
                    <td className="p-3">{item.user}</td>
                    <td className="p-3">
                      <div className="max-w-xs truncate text-gray-600">
                        {item.prompt}
                      </div>
                    </td>
                    <td className="p-3">{getStatusBadge(item.status)}</td>
                    <td className="p-3">{item.cost}</td>
                    <td className="p-3 text-gray-600">{item.created}</td>
                    <td className="p-3">
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAIMedia;
