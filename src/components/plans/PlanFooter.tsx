import React from 'react';
import { Link } from 'react-router-dom';

export const PlanFooter: React.FC = () => {
  return (
    <footer className="border-t bg-muted/30 py-8 mt-auto">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <img 
              src="/assets/images/ee751fd8-27e0-476e-9479-10ef458dbe4e.png" 
              alt="Camply" 
              className="h-6 w-auto opacity-70"
            />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Camply. Todos os direitos reservados.
            </span>
          </div>
          
          <div className="flex gap-6">
            <Link 
              to="/legal/privacy" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacidade
            </Link>
            <Link 
              to="/legal/terms" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Termos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
