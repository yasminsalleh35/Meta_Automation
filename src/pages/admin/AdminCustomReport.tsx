import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileBarChart, Download, Copy, Sparkles } from 'lucide-react';
import { ReportPreview } from '@/components/admin/ReportPreview';
import { useReportGenerator } from '@/hooks/useReportGenerator';
import { useToast } from '@/hooks/use-toast';

const AdminCustomReport: React.FC = () => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const { parseMarkdown, generatePDF, isGenerating } = useReportGenerator();
  const { toast } = useToast();

  const parsedContent = parseMarkdown(content);

  const handleDownloadPDF = async () => {
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, adicione um título ao relatório.",
        variant: "destructive"
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Conteúdo obrigatório",
        description: "Por favor, adicione conteúdo ao relatório.",
        variant: "destructive"
      });
      return;
    }

    await generatePDF(title);
  };

  const handleCopyHTML = () => {
    const reportElement = document.querySelector('[data-custom-report-content]');
    if (!reportElement) return;

    const htmlContent = reportElement.innerHTML;
    navigator.clipboard.writeText(htmlContent);
    
    toast({
      title: "HTML copiado!",
      description: "O código HTML do relatório foi copiado para a área de transferência.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-camply-dark flex items-center">
            <FileBarChart className="w-8 h-8 mr-3 text-camply-blue" />
            Relatório Personalizado
          </h1>
          <p className="text-muted-foreground mt-1">
            Cole seu relatório e baixe em PDF com estilo visual Camply
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleCopyHTML}
            disabled={!content.trim()}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar HTML
          </Button>
          <Button 
            onClick={handleDownloadPDF}
            disabled={isGenerating || !content.trim() || !title.trim()}
            className="bg-camply-blue hover:bg-camply-blue/90"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? 'Gerando PDF...' : 'Baixar PDF'}
          </Button>
        </div>
      </div>

      {/* Editor and Preview Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card className="shadow-lg border-camply-blue/20">
          <CardHeader className="bg-gradient-to-r from-camply-blue/5 to-camply-green/5">
            <CardTitle className="flex items-center text-camply-dark">
              <Sparkles className="w-5 h-5 mr-2 text-camply-blue" />
              Editor
            </CardTitle>
            <CardDescription>
              Preencha os campos abaixo para criar seu relatório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-camply-dark font-semibold">
                Título do Relatório *
              </Label>
              <Input
                id="title"
                placeholder="Ex: Relatório de Análise Estratégica"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-camply-blue/30 focus:border-camply-blue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle" className="text-camply-dark font-semibold">
                Subtítulo (opcional)
              </Label>
              <Input
                id="subtitle"
                placeholder="Ex: Análise de Mercado - Q1 2024"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="border-camply-blue/30 focus:border-camply-blue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-camply-dark font-semibold">
                Conteúdo do Relatório *
              </Label>
              <Textarea
                id="content"
                placeholder={`Cole seu relatório aqui...

Você pode usar Markdown:
# Título Principal
## Subtítulo
### Seção

- Item de lista
- Outro item

**Texto em negrito**
*Texto em itálico*

Tabelas também funcionam!`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm border-camply-blue/30 focus:border-camply-blue"
              />
            </div>

            <div className="bg-camply-blue/5 p-4 rounded-lg border border-camply-blue/20">
              <p className="text-xs text-camply-dark">
                <strong>Dica:</strong> Use Markdown para formatação. Títulos com #, ## ou ### 
                serão automaticamente estilizados com as cores do Camply.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="shadow-lg border-camply-green/20">
          <CardHeader className="bg-gradient-to-r from-camply-green/5 to-camply-blue/5">
            <CardTitle className="flex items-center text-camply-dark">
              <FileBarChart className="w-5 h-5 mr-2 text-camply-green" />
              Preview em Tempo Real
            </CardTitle>
            <CardDescription>
              Visualização com estilo visual Camply
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-white rounded-lg border-2 border-dashed border-camply-blue/20 p-6 min-h-[500px] max-h-[600px] overflow-y-auto">
              {!content.trim() && !title.trim() ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                  <FileBarChart className="w-16 h-16 text-camply-blue/30" />
                  <div>
                    <p className="text-camply-dark/60 font-medium">
                      Preencha o editor para ver o preview
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seu relatório aparecerá aqui com o estilo Camply
                    </p>
                  </div>
                </div>
              ) : (
                <ReportPreview
                  title={title}
                  subtitle={subtitle}
                  content={parsedContent}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCustomReport;
