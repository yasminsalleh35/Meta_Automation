
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface MetaAdsConnectionStepProps {
  onConnect: () => void;
  isLoading: boolean;
}

const MetaAdsConnectionStep: React.FC<MetaAdsConnectionStepProps> = ({
  onConnect,
  isLoading
}) => {
  return (
    <div className="text-center space-y-4 py-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Conectar Meta Ads
        </h3>
        <p className="text-muted-foreground">
          Conecte sua conta Meta para gerenciar campanhas do Facebook e Instagram
        </p>
      </div>
      
      <Button 
        onClick={onConnect} 
        disabled={isLoading}
        className="w-full max-w-xs"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Conectando...
          </>
        ) : (
          'Conectar Meta Ads'
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
        Ao conectar, você concorda com nossa{' '}
        <a
          href="https://iacamply.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Política de Privacidade
        </a>
        {' '}e{' '}
        <a
          href="https://iacamply.com/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Termos de Serviço
        </a>
      </p>
    </div>
  );
};

export default MetaAdsConnectionStep;
