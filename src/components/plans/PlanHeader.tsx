import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface PlanHeaderProps {
  showLoginButton?: boolean;
}

export const PlanHeader: React.FC<PlanHeaderProps> = ({ showLoginButton = true }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/assets/images/ee751fd8-27e0-476e-9479-10ef458dbe4e.png" 
            alt="Camply Logo" 
            className="h-8 w-auto"
          />
        </Link>
        
        {showLoginButton && (
          <Link to="/auth/login">
            <Button variant="outline" size="sm">
              Entrar
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};
