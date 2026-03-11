
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';

const scrollToCheckout = () => {
  const checkoutSection = document.getElementById('checkout');
  if (checkoutSection) {
    checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

interface LandingHeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const { isMobile, isTablet } = useResponsive();

  return (
    <header className="border-b bg-white sticky top-0 z-50 safe-area-inset shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-5 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="/logos/camply-icon.png" 
              alt="Camply" 
              className="h-7 w-auto sm:h-8 lg:h-10"
            />
          </div>
          
          {!isMobile && (
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link to="/auth/login">
                <Button 
                  variant="ghost" 
                  size={isTablet ? "sm" : "default"} 
                  className="touch-target hover:bg-camply-blue/10 hover:text-camply-blue transition-all"
                >
                  Entrar
                </Button>
              </Link>
              <Button 
                onClick={scrollToCheckout}
                size={isTablet ? "sm" : "default"} 
                className="touch-target bg-camply-blue hover:bg-camply-blue/90 text-white shadow-lg hover:shadow-xl transition-all"
              >
                Assinar Agora
              </Button>
            </div>
          )}

          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 touch-target hover:bg-camply-blue/10"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>

        {isMobile && mobileMenuOpen && (
          <div className="mt-3 pb-3 border-t pt-3 space-y-2 animate-fade-in">
            <Link to="/auth/login" className="block" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start touch-target hover:bg-camply-blue/10">
                Entrar
              </Button>
            </Link>
            <Button 
              onClick={() => {
                scrollToCheckout();
                setMobileMenuOpen(false);
              }}
              className="w-full touch-target bg-camply-blue hover:bg-camply-blue/90 text-white"
            >
              Assinar Agora
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
