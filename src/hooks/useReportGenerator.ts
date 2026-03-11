import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ParsedContent, Section } from '@/components/admin/ReportPreview';

export const useReportGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const parseMarkdown = (markdown: string): ParsedContent => {
    const lines = markdown.split('\n');
    const sections: Section[] = [];

    let currentList: string[] = [];
    let currentTableHeaders: string[] = [];
    let currentTableRows: string[][] = [];
    let inTable = false;

    const flushList = () => {
      if (currentList.length > 0) {
        sections.push({ type: 'list', content: '', items: currentList });
        currentList = [];
      }
    };

    const flushTable = () => {
      if (currentTableHeaders.length > 0 && currentTableRows.length > 0) {
        sections.push({
          type: 'table',
          content: '',
          headers: currentTableHeaders,
          rows: currentTableRows
        });
        currentTableHeaders = [];
        currentTableRows = [];
      }
      inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        flushList();
        flushTable();
        continue;
      }

      // Heading 1
      if (line.startsWith('# ')) {
        flushList();
        flushTable();
        sections.push({ type: 'heading1', content: line.substring(2) });
        continue;
      }

      // Heading 2
      if (line.startsWith('## ')) {
        flushList();
        flushTable();
        sections.push({ type: 'heading2', content: line.substring(3) });
        continue;
      }

      // Heading 3
      if (line.startsWith('### ')) {
        flushList();
        flushTable();
        sections.push({ type: 'heading3', content: line.substring(4) });
        continue;
      }

      // List item
      if (line.startsWith('- ') || line.startsWith('* ')) {
        flushTable();
        currentList.push(line.substring(2));
        continue;
      }

      // Table detection
      if (line.includes('|')) {
        flushList();
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        
        if (!inTable) {
          // First row is headers
          currentTableHeaders = cells;
          inTable = true;
        } else if (i > 0 && lines[i - 1].includes('---')) {
          // Skip separator line
          continue;
        } else {
          // Data row
          currentTableRows.push(cells);
        }
        continue;
      }

      // Regular paragraph
      flushList();
      flushTable();
      
      // Handle bold and italic inline
      if (line.includes('**') || line.includes('*')) {
        sections.push({ type: 'paragraph', content: line });
      } else {
        sections.push({ type: 'paragraph', content: line });
      }
    }

    // Flush any remaining items
    flushList();
    flushTable();

    return { sections };
  };

  const generatePDF = async (title: string) => {
    setIsGenerating(true);
    try {
      toast({
        title: "Gerando PDF profissional",
        description: "Capturando relatório com estilo Camply...",
      });

      const reportContent = document.querySelector('[data-custom-report-content]') as HTMLElement;
      if (!reportContent) {
        throw new Error('Conteúdo do relatório não encontrado');
      }

      // Add temporary optimization class
      document.body.classList.add('pdf-rendering');
      reportContent.classList.add('pdf-optimized');

      await new Promise(resolve => setTimeout(resolve, 500));

      // High quality canvas capture with optimized settings
      const canvas = await html2canvas(reportContent, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: reportContent.scrollWidth,
        height: reportContent.scrollHeight,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-custom-report-content]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.webkitTransform = 'none';
            clonedElement.style.maxWidth = 'none';
            clonedElement.style.maxHeight = 'none';
            clonedElement.style.overflow = 'visible';
            clonedElement.style.width = '210mm';
            clonedElement.style.padding = '20mm';
            
            // Force SVG rendering
            const svgElements = clonedElement.querySelectorAll('svg');
            svgElements.forEach(svg => {
              svg.style.display = 'inline-block';
              svg.style.verticalAlign = 'middle';
            });
          }
        }
      });

      document.body.classList.remove('pdf-rendering');
      reportContent.classList.remove('pdf-optimized');

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        precision: 2
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Reservar 25mm para área segura do rodapé
      const footerSafeZone = 25;
      const pageContentHeight = pdfHeight - footerSafeZone;
      
      const totalPages = Math.ceil(imgHeight / pageContentHeight);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        // Calculate Y position to show correct slice of the image
        const yPosition = -(page * pageContentHeight);
        
        pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
        
        // Limpar área do rodapé para evitar texto invadindo
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, pdfHeight - 20, pdfWidth, 20, 'F');
        
        // Add page number to all pages
        pdf.setFontSize(10);
        pdf.setTextColor(108, 114, 128);
        pdf.text(
          `Página ${page + 1} de ${totalPages}`,
          pdfWidth - 20,
          pdfHeight - 10,
          { align: 'right' }
        );
      }

      pdf.setProperties({
        title: title,
        subject: 'Relatório Personalizado Camply',
        author: 'Camply',
        creator: 'Camply Platform'
      });

      const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '-')}-${date}.pdf`;
      
      pdf.save(fileName);

      toast({
        title: "PDF gerado com sucesso!",
        description: "Relatório baixado com qualidade profissional.",
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    parseMarkdown,
    generatePDF,
    isGenerating
  };
};
