// Audit LGL-02: banner de consentimento de cookies.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getStoredConsent,
  loadConsentedScripts,
  saveConsent,
  openCookiePreferences,
  OPEN_COOKIE_PREFERENCES_EVENT,
} from '@/lib/cookieConsent';

export const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setAnalytics(stored.choices.analytics);
      setMarketing(stored.choices.marketing);
      loadConsentedScripts(stored.choices);
    } else {
      setShowBanner(true);
    }

    const open = () => {
      const current = getStoredConsent();
      setAnalytics(current?.choices.analytics ?? false);
      setMarketing(current?.choices.marketing ?? false);
      setShowPreferences(true);
    };
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, open);
  }, []);

  const finish = (choices: { analytics: boolean; marketing: boolean }) => {
    saveConsent(choices);
    setAnalytics(choices.analytics);
    setMarketing(choices.marketing);
    setShowBanner(false);
    setShowPreferences(false);
  };

  return (
    <>
      {showBanner && !showPreferences && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Aviso de cookies"
          className="fixed inset-x-0 bottom-0 z-[100] border-t bg-background/95 backdrop-blur shadow-lg"
        >
          <div className="container mx-auto flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground md:max-w-3xl">
              Usamos cookies essenciais para o funcionamento da plataforma (login, segurança e
              preferências). Cookies de análise e de marketing só são usados com a sua autorização.
              Saiba mais na nossa{' '}
              <Link to="/legal/privacy" className="text-primary underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setShowPreferences(true)}>
                Preferências
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => finish({ analytics: false, marketing: false })}
              >
                Apenas essenciais
              </Button>
              <Button size="sm" onClick={() => finish({ analytics: true, marketing: true })}>
                Aceitar todos
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Preferências de cookies</DialogTitle>
            <DialogDescription>
              Escolha quais categorias você autoriza. Você pode alterar essa escolha a qualquer
              momento pelo link "Preferências de cookies" no rodapé.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label className="font-medium">Essenciais</Label>
                <p className="text-xs text-muted-foreground">
                  Necessários para login, segurança e funcionamento do site. Não podem ser desativados.
                </p>
              </div>
              <Switch checked disabled aria-label="Cookies essenciais (sempre ativos)" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="cookie-analytics" className="font-medium">Análise</Label>
                <p className="text-xs text-muted-foreground">
                  Ajudam a entender como o site é usado para melhorá-lo.
                </p>
              </div>
              <Switch id="cookie-analytics" checked={analytics} onCheckedChange={setAnalytics} />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="cookie-marketing" className="font-medium">Marketing</Label>
                <p className="text-xs text-muted-foreground">
                  Permitem medir campanhas e exibir anúncios relevantes em outras plataformas.
                </p>
              </div>
              <Switch id="cookie-marketing" checked={marketing} onCheckedChange={setMarketing} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => finish({ analytics: false, marketing: false })}>
              Apenas essenciais
            </Button>
            <Button onClick={() => finish({ analytics, marketing })}>Salvar preferências</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/** Link para reabrir as preferências (rodapés). */
export const CookiePreferencesLink: React.FC<{ className?: string }> = ({ className }) => (
  <button
    type="button"
    onClick={openCookiePreferences}
    className={className}
  >
    Preferências de cookies
  </button>
);
