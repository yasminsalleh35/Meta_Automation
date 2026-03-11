
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          {t('settings.language')}
        </CardTitle>
        <CardDescription>
          {t('settings.language.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="language-select">{t('settings.language.label')}</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">
                🇧🇷 {t('settings.language.portuguese')}
              </SelectItem>
              <SelectItem value="en">
                🇺🇸 {t('settings.language.english')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageSelector;
