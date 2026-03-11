
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, BookOpen } from 'lucide-react';

const Guides: React.FC = () => {
  const guides = [
    {
      title: "Guia Completo do Meta Ads",
      description: "Manual completo para dominar a plataforma de anúncios do Meta",
      pages: "45 páginas",
      format: "PDF",
      category: "Completo"
    },
    {
      title: "Melhores Práticas para E-commerce",
      description: "Estratégias específicas para lojas online aumentarem suas vendas",
      pages: "28 páginas",
      format: "PDF",
      category: "E-commerce"
    },
    {
      title: "Guia de Segmentação de Público",
      description: "Como definir e encontrar seu público-alvo ideal",
      pages: "22 páginas",
      format: "PDF",
      category: "Targeting"
    },
    {
      title: "Otimização de Orçamento",
      description: "Como distribuir seu orçamento para maximizar resultados",
      pages: "18 páginas",
      format: "PDF",
      category: "Orçamento"
    },
    {
      title: "Copywriting para Anúncios",
      description: "Técnicas de escrita persuasiva para seus anúncios",
      pages: "35 páginas",
      format: "PDF",
      category: "Criativo"
    },
    {
      title: "Análise de Métricas",
      description: "Como interpretar e agir com base nos dados das campanhas",
      pages: "40 páginas",
      format: "PDF",
      category: "Analytics"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Guias</h1>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Biblioteca de Guias
            </CardTitle>
            <CardDescription>
              Materiais de apoio em PDF para aprofundar seus conhecimentos
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {guides.map((guide, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                    <CardDescription>{guide.description}</CardDescription>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{guide.category}</Badge>
                    <Badge variant="secondary">{guide.pages}</Badge>
                    <Badge variant="secondary">{guide.format}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Ver
                    </Button>
                    <Button size="sm" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Guides;
