import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LanguageSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

// Lista dos idiomas mais comuns suportados pela Meta
const AVAILABLE_LANGUAGES = [
  { code: 'pt_BR', label: 'Português (Brasil)' },
  { code: 'en_US', label: 'Inglês (Estados Unidos)' },
  { code: 'es_ES', label: 'Espanhol (Espanha)' },
  { code: 'es_LA', label: 'Espanhol (América Latina)' },
  { code: 'fr_FR', label: 'Francês (França)' },
  { code: 'de_DE', label: 'Alemão (Alemanha)' },
  { code: 'it_IT', label: 'Italiano (Itália)' },
  { code: 'ja_JP', label: 'Japonês (Japão)' },
  { code: 'ar_AR', label: 'Árabe (Padrão)' },
  { code: 'hi_IN', label: 'Hindi (Índia)' },
  { code: 'ko_KR', label: 'Coreano (Coreia)' },
  { code: 'zh_CN', label: 'Chinês Simplificado' },
  { code: 'zh_TW', label: 'Chinês Tradicional (Taiwan)' },
  { code: 'ru_RU', label: 'Russo (Rússia)' },
  { code: 'nl_NL', label: 'Holandês (Holanda)' },
  { code: 'pl_PL', label: 'Polonês (Polônia)' },
  { code: 'tr_TR', label: 'Turco (Turquia)' },
  { code: 'th_TH', label: 'Tailandês (Tailândia)' },
  { code: 'vi_VN', label: 'Vietnamita (Vietnã)' },
  { code: 'id_ID', label: 'Indonésio (Indonésia)' },
];

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>('');

  const addLanguage = (code: string) => {
    if (code && !value.includes(code)) {
      onChange([...value, code]);
      setSelectedLanguage('');
    }
  };

  const removeLanguage = (code: string) => {
    onChange(value.filter(lang => lang !== code));
  };

  const getLanguageLabel = (code: string) => {
    return AVAILABLE_LANGUAGES.find(lang => lang.code === code)?.label || code;
  };

  const availableToAdd = AVAILABLE_LANGUAGES.filter(
    lang => !value.includes(lang.code)
  );

  return (
    <div className="space-y-4">
      {/* Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Selecionar Idiomas</CardTitle>
          <CardDescription className="text-xs">
            Escolha os idiomas que o Meta API deve usar para targeting. Formato ISO: ll_CC (ex: pt_BR, en_US)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um idioma" />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label} ({lang.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={() => addLanguage(selectedLanguage)}
              disabled={!selectedLanguage}
              size="sm"
            >
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Languages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Idiomas Selecionados ({value.length})</CardTitle>
          <CardDescription className="text-xs">
            {value.length === 0 
              ? 'Nenhum idioma selecionado (sem restrição de idioma)'
              : 'Anúncios serão exibidos apenas para usuários com estes idiomas configurados'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {value.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
              Nenhum idioma selecionado
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {value.map(code => (
                <Badge key={code} variant="secondary" className="text-xs py-1 px-2">
                  {getLanguageLabel(code)}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-2 hover:bg-transparent"
                    onClick={() => removeLanguage(code)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      {value.length > 0 && (
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900">
          <strong>📘 Como funciona:</strong> Ao criar campanhas, o Meta API receberá:
          <code className="block mt-1 bg-white dark:bg-slate-900 p-2 rounded">
            "targeting": {'{'} "languages": {JSON.stringify(value)} {'}'}
          </code>
          Isso fará com que o anúncio seja exibido apenas para usuários com estes idiomas configurados no perfil do Facebook/Instagram.
        </div>
      )}
    </div>
  );
}
