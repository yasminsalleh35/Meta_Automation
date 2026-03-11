import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  DollarSign, 
  MapPin, 
  Target, 
  Lightbulb,
  Calendar,
  Download,
  Copy,
  Trash2
} from 'lucide-react';
import { StrategyReport } from '@/types/strategy.types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


const StrategyReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<StrategyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  const loadReport = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('strategy_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        title: "Erro ao carregar relatório",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      navigate('/dashboard/strategy-report');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReport = async () => {
    if (!id) return;

    try {
      const { error } = await supabase.functions.invoke('strategy-report', {
        method: 'DELETE',
        body: { reportId: id }
      });

      if (error) throw error;

      toast({
        title: "Relatório excluído",
        description: "O relatório foi excluído com sucesso.",
      });
      navigate('/dashboard/strategy-report');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const duplicateReport = async () => {
    if (!report) return;

    try {
      const { data, error } = await supabase.functions.invoke('strategy-report', {
        body: {
          ...report.payload,
          businessName: report.payload.businessName
        }
      });

      if (error) throw error;

      toast({
        title: "Relatório duplicado!",
        description: "Uma cópia do relatório foi criada com sucesso."
      });

      navigate(`/dashboard/strategy-report/${data.report.id}`);
    } catch (error) {
      console.error('Error duplicating report:', error);
      toast({
        title: "Erro ao duplicar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const downloadPDF = async () => {
    if (!report) return;

    setIsGeneratingPDF(true);
    try {
      toast({
        title: "Gerando PDF profissional",
        description: "Capturando layout original com todos os elementos visuais...",
      });

      // Localizar o conteúdo original do relatório na página
      const reportContent = document.querySelector('[data-report-content]') as HTMLElement;
      if (!reportContent) {
        throw new Error('Conteúdo do relatório não encontrado');
      }

      // Adicionar classe para otimização PDF temporariamente
      document.body.classList.add('pdf-rendering');
      reportContent.classList.add('pdf-optimized');

      // Aguardar um momento para aplicar estilos
      await new Promise(resolve => setTimeout(resolve, 500));

      // Configurações otimizadas do html2canvas para manter qualidade visual
      const canvas = await html2canvas(reportContent, {
        scale: 3, // Alta qualidade para impressão
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: reportContent.scrollWidth,
        height: reportContent.scrollHeight,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        removeContainer: false,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // Aplicar otimizações específicas para PDF no clone
          const clonedElement = clonedDoc.querySelector('[data-report-content]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.webkitTransform = 'none';
            clonedElement.style.maxWidth = 'none';
            clonedElement.style.width = 'auto';
            
            // Forçar renderização de ícones SVG
            const svgElements = clonedElement.querySelectorAll('svg');
            svgElements.forEach(svg => {
              svg.style.display = 'inline-block';
              svg.style.verticalAlign = 'middle';
            });

            // Otimizar cores de badges para impressão
            const badges = clonedElement.querySelectorAll('.bg-green-100');
            badges.forEach(badge => {
              (badge as HTMLElement).style.backgroundColor = '#dcfce7';
              (badge as HTMLElement).style.color = '#166534';
              (badge as HTMLElement).style.border = '1px solid #bbf7d0';
            });
          }
        }
      });

      // Remover classes temporárias
      document.body.classList.remove('pdf-rendering');
      reportContent.classList.remove('pdf-optimized');

      // Configurações otimizadas do jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        precision: 2
      });

      // Converter canvas para JPEG de alta qualidade
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular dimensões mantendo proporção
      const canvasAspectRatio = canvas.width / canvas.height;
      const pdfAspectRatio = pdfWidth / pdfHeight;
      
      let finalWidth = pdfWidth;
      let finalHeight = pdfHeight;
      
      if (canvasAspectRatio > pdfAspectRatio) {
        finalHeight = pdfWidth / canvasAspectRatio;
      } else {
        finalWidth = pdfHeight * canvasAspectRatio;
      }

      // Centralizar imagem na página
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;

      // Implementar paginação inteligente
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * finalWidth) / canvas.width;
      
      if (imgHeight <= pageHeight) {
        // Conteúdo cabe em uma página
        pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
      } else {
        // Dividir em múltiplas páginas
        let heightLeft = imgHeight;
        let position = 0;
        let pageCount = 1;

        // Primeira página
        pdf.addImage(imgData, 'JPEG', 0, position, finalWidth, imgHeight);
        heightLeft -= pageHeight;

        // Páginas subsequentes
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, finalWidth, imgHeight);
          heightLeft -= pageHeight;
          pageCount++;
          
          // Adicionar numeração de páginas
          pdf.setFontSize(10);
          pdf.setTextColor(108, 114, 128); // text-gray-500
          pdf.text(
            `Página ${pageCount}`,
            pdfWidth - 20,
            pdfHeight - 10,
            { align: 'right' }
          );
        }
      }

      // Metadados do PDF
      pdf.setProperties({
        title: report.title,
        subject: 'Relatório Estratégico Meta Ads',
        author: 'Meta Ads Strategy Platform',
        creator: 'Meta Ads Strategy Platform'
      });

      // Nome do arquivo otimizado
      const businessName = report.payload.businessName || 'Estrategia';
      const date = new Date(report.created_at).toLocaleDateString('pt-BR').replace(/\//g, '-');
      const fileName = `${businessName}-Relatorio-Estrategico-${date}.pdf`;
      
      pdf.save(fileName);

      toast({
        title: "PDF profissional gerado!",
        description: "Relatório baixado com qualidade de impressão otimizada.",
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getClassBadgeColor = (economicClass: string) => {
    switch (economicClass) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'A/B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'B/C': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto p-6">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Relatório não encontrado</h2>
          <Button onClick={() => navigate('/dashboard/strategy-report')}>
            Voltar para relatórios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/strategy-report')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="w-8 h-8 mr-3 text-orange-600" />
              {report.title}
            </h1>
            <p className="text-muted-foreground flex items-center mt-1">
              <Calendar className="w-4 h-4 mr-2" />
              Gerado em {new Date(report.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={duplicateReport}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicar
          </Button>
          <Button 
            variant="outline" 
            onClick={downloadPDF}
            disabled={isGeneratingPDF}
          >
            <Download className="w-4 h-4 mr-2" />
            {isGeneratingPDF ? 'Gerando...' : 'PDF'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir relatório</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteReport}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Conteúdo do Relatório para PDF */}
      <div data-report-content>
        {/* Resumo Executivo */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Resumo Executivo
            </CardTitle>
            <Badge className={`${getClassBadgeColor(report.result.economicClass)} font-semibold text-lg px-4 py-2`}>
              Classe {report.result.economicClass}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {report.result.ageRange[0]}-{report.result.ageRange[1]}
              </div>
              <div className="text-sm text-muted-foreground">Faixa Etária</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                R$ {report.result.dailyBudgetBRL}
              </div>
              <div className="text-sm text-muted-foreground">Orçamento Diário</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {report.result.interests.length}
              </div>
              <div className="text-sm text-muted-foreground">Interesses</div>
            </div>
            
            {report.result.neighborhoods && (
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {report.result.neighborhoods.length}
                </div>
                <div className="text-sm text-muted-foreground">Bairros Premium</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Análise Detalhada */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Público-Alvo */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-orange-600" />
              Público-Alvo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Faixa Etária: {report.result.ageRange[0]}-{report.result.ageRange[1]} anos</h4>
              <p className="text-sm text-muted-foreground">
                Definida com base nas especialidades selecionadas e seus perfis típicos de pacientes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Classe Econômica: {report.result.economicClass}</h4>
              <p className="text-sm text-muted-foreground">
                {report.result.rationale.class}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Localização */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-purple-600" />
              Estratégia de Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.result.neighborhoods ? (
              <div>
                <h4 className="font-semibold mb-2">Bairros Premium Recomendados:</h4>
                <div className="flex flex-wrap gap-2">
                  {report.result.neighborhoods.map((neighborhood) => (
                    <Badge key={neighborhood} variant="secondary" className="text-xs">
                      {neighborhood}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold mb-2">Segmentação Ampla</h4>
                <p className="text-sm text-muted-foreground">
                  Recomendamos segmentação por cidade e raio para alcançar um público mais amplo.
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {report.result.rationale.location}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interesses e Orçamento */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Interesses */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Interesses Sugeridos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {report.result.interests.map((interest) => (
                  <Badge key={interest} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {report.result.rationale.interests}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Orçamento */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Orçamento Recomendado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-1">
                R$ {report.result.dailyBudgetBRL}
              </div>
              <div className="text-sm text-green-800">por dia</div>
            </div>
            <p className="text-sm text-muted-foreground">
              {report.result.rationale.budget}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sugestões de Criativos */}
      <Card className="shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
            Sugestões de Criativos
          </CardTitle>
          <CardDescription>
            Exemplos de títulos e textos para suas campanhas (apenas como referência)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {report.result.creativeSamples.map((sample, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">{sample.title}</h4>
                <p className="text-sm text-muted-foreground">{sample.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default StrategyReportView;