import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface WelcomeBannerProps {
  userId: string;
  onDismiss?: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ userId, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário já dispensou o banner
    const dismissed = localStorage.getItem(`camply_welcome_banner_dismissed_${userId}`);
    if (dismissed === 'true') {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [userId]);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(`camply_welcome_banner_dismissed_${userId}`, 'true');
    }
    setIsVisible(false);
    onDismiss?.();
  };

  const handleCtaClick = () => {
    // Salvar dismissal permanente ao clicar no CTA
    localStorage.setItem(`camply_welcome_banner_dismissed_${userId}`, 'true');
    navigate('/dashboard/tutorials');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Alert className="relative border-l-4 border-primary bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
          {/* Botão fechar */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Conteúdo principal */}
          <div className="flex flex-col sm:flex-row gap-4 pr-8">
            {/* Ícone decorativo */}
            <div className="hidden sm:flex items-start pt-1">
              <div className="p-3 bg-primary/10 rounded-full">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
            </div>

            {/* Texto e ações */}
            <div className="flex-1 space-y-3">
              <AlertTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Rocket className="h-5 w-5 sm:hidden text-primary" />
                🎉 Bem-vindo(a) ao Camply!
              </AlertTitle>
              
              <AlertDescription className="text-sm text-muted-foreground leading-relaxed">
                Você acaba de dar o primeiro passo para anunciar com inteligência e simplicidade. 🚀
                <br />
                Nossa IA vai te ajudar a criar campanhas poderosas e gerar resultados reais — sem complicação.
              </AlertDescription>

              <div className="pt-2 space-y-3">
                {/* Chamada para ação */}
                <p className="text-sm font-medium text-foreground">
                  👉 Comece agora pelos <span className="font-bold">Primeiros Passos</span> e veja como criar sua primeira campanha em minutos!
                </p>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <Button
                    onClick={handleCtaClick}
                    className="gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Acessar área de aprendizado
                  </Button>

                  {/* Checkbox "Não mostrar novamente" */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="dontShowAgain"
                      checked={dontShowAgain}
                      onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                    />
                    <label
                      htmlFor="dontShowAgain"
                      className="text-sm text-muted-foreground cursor-pointer select-none"
                    >
                      🔕 Não mostrar novamente
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};
