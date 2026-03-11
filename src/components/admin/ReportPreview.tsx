import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface ReportPreviewProps {
  title: string;
  subtitle?: string;
  content: ParsedContent;
}

export interface ParsedContent {
  sections: Section[];
}

export interface Section {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'list' | 'table' | 'bold' | 'italic';
  content: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ title, subtitle, content }) => {
  const today = new Date().toLocaleDateString('pt-BR');

  const renderSection = (section: Section, index: number) => {
    switch (section.type) {
      case 'heading1':
        return (
          <div key={index} className="mb-6 pb-4 border-b-2 border-camply-blue">
            <h2 className="text-2xl font-bold text-camply-blue flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-camply-blue" />
              {section.content}
            </h2>
          </div>
        );
      
      case 'heading2':
        return (
          <div key={index} className="mb-4 mt-6">
            <h3 className="text-xl font-semibold text-camply-dark flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-camply-blue to-camply-green rounded-full" />
              {section.content}
            </h3>
          </div>
        );
      
      case 'heading3':
        return (
          <h4 key={index} className="text-lg font-semibold text-camply-dark mb-3 mt-4">
            {section.content}
          </h4>
        );
      
      case 'paragraph':
        return (
          <p key={index} className="text-camply-dark/80 mb-3 leading-relaxed">
            {section.content}
          </p>
        );
      
      case 'list':
        return (
          <ul key={index} className="space-y-2 mb-4 ml-4">
            {section.items?.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-camply-dark/80">
                <CheckCircle2 className="w-5 h-5 text-camply-green mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      
      case 'table':
        return (
          <div key={index} className="mb-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-camply-blue to-camply-green">
                  {section.headers?.map((header, i) => (
                    <th key={i} className="text-white font-semibold p-3 text-left border border-camply-blue/20">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows?.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-camply-blue/5' : 'bg-white'}>
                    {row.map((cell, j) => (
                      <td key={j} className="p-3 border border-camply-blue/10 text-camply-dark/80">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'bold':
        return (
          <strong key={index} className="font-semibold text-camply-dark">
            {section.content}
          </strong>
        );

      case 'italic':
        return (
          <em key={index} className="italic text-camply-dark/80">
            {section.content}
          </em>
        );
      
      default:
        return null;
    }
  };

  return (
    <div data-custom-report-content className="space-y-4 font-inter">
      {/* Header com Logo e Título */}
      <div className="mb-8 pb-6 border-b-4 border-gradient-to-r from-camply-blue via-camply-green to-camply-yellow">
        <div className="flex items-start justify-between mb-4">
          <img 
            src="/logos/camply-logo-azul.png" 
            alt="Camply" 
            className="h-12 w-auto"
          />
          <div className="text-right text-sm text-camply-dark/60">
            <p className="font-medium">Data: {today}</p>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-camply-blue mb-2">
          {title}
        </h1>
        
        {subtitle && (
          <p className="text-lg text-camply-dark/70 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Conteúdo */}
      <div className="prose max-w-none pb-20 pdf-page-content">
        {content.sections.length === 0 ? (
          <p className="text-camply-dark/50 italic text-center py-8">
            Adicione conteúdo no editor para visualizar aqui...
          </p>
        ) : (
          content.sections.map((section, index) => (
            <div key={index} className="page-break-avoid">
              {renderSection(section, index)}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t-2 border-gradient-to-r from-camply-blue/20 to-camply-green/20">
        <div className="flex items-center justify-between text-sm text-camply-dark/50">
          <div className="flex items-center gap-2">
            <img 
              src="/logos/camply-logo-transparente.png" 
              alt="Camply" 
              className="h-6 w-auto opacity-50"
            />
            <span>Gerado por Camply</span>
          </div>
          <span>© {new Date().getFullYear()} Camply. Todos os direitos reservados.</span>
        </div>
      </div>
    </div>
  );
};
