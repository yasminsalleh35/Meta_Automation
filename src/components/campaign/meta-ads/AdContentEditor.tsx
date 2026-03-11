
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

interface AdContentEditorProps {
  adTitle: string;
  adText: string;
  isGeneratingTitle: boolean;
  isGeneratingCopy: boolean;
  onTitleChange: (title: string) => void;
  onTextChange: (text: string) => void;
  onGenerateTitle: () => void;
  onGenerateCopy: () => void;
}

export const AdContentEditor: React.FC<AdContentEditorProps> = ({
  adTitle,
  adText,
  isGeneratingTitle,
  isGeneratingCopy,
  onTitleChange,
  onTextChange,
  onGenerateTitle,
  onGenerateCopy
}) => {
  return (
    <>
      {/* Ad Title */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Título do Anúncio</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onGenerateTitle}
              disabled={isGeneratingTitle}
            >
              {isGeneratingTitle ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isGeneratingTitle ? 'Gerando...' : 'Gerar com IA'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={adTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Digite o título principal do seu anúncio..."
            maxLength={40}
          />
          <div className="flex justify-between mt-2">
            <p className="text-xs text-gray-500">
              Título que aparecerá em destaque no anúncio
            </p>
            <p className="text-xs text-gray-500">
              {adTitle.length}/40
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ad Copy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Texto do Anúncio</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onGenerateCopy}
              disabled={isGeneratingCopy}
            >
              {isGeneratingCopy ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isGeneratingCopy ? 'Gerando...' : 'Gerar com IA'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={adText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Digite o texto que aparecerá no seu anúncio..."
            rows={4}
            maxLength={500}
          />
          <div className="flex justify-between mt-2">
            <p className="text-xs text-gray-500">
              Use emojis e call-to-actions persuasivos
            </p>
            <p className="text-xs text-gray-500">
              {adText.length}/500
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
