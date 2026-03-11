import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Target, Clock, Phone, Mail, MessageCircle } from 'lucide-react';

interface StepReviewProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

const budgetLabels: { [key: string]: string } = {
  'under-1k': 'Até R$ 1.000',
  '1k-2k': 'R$ 1.000 - R$ 2.000',
  '2k-5k': 'R$ 2.000 - R$ 5.000',
  '5k-10k': 'R$ 5.000 - R$ 10.000',
  'over-10k': 'Mais de R$ 10.000',
};

const goalLabels: { [key: string]: string } = {
  'leads': 'Gerar mais consultas',
  'branding': 'Fortalecer a marca',
  'launch': 'Lançar novo serviço',
  'compete': 'Competir no mercado',
  'premium': 'Atrair pacientes premium',
  'diversify': 'Diversificar tratamentos',
};

const timingLabels: { [key: string]: string } = {
  'immediate': 'Imediatamente',
  '30d': 'Em até 30 dias',
  '60d': 'Em 30-60 dias',
  '90d+': 'Em mais de 60 dias',
};

const channelLabels: { [key: string]: string } = {
  'whatsapp': 'WhatsApp',
  'phone': 'Ligação',
  'email': 'E-mail',
  'any': 'Qualquer canal',
};

export const StepReview: React.FC<StepReviewProps> = ({ data, updateData }) => {
  const formatWhatsApp = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Resumo dos dados */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Revise suas informações</h3>
        <p className="text-gray-600 mb-6">
          Confirme se todos os dados estão corretos antes de finalizar.
        </p>
      </div>

      {/* Informações pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4" />
            Informações da Clínica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-medium">{data.name}</p>
            <p className="text-sm text-gray-600">{data.clinic_name}</p>
          </div>
          <div>
            <p className="text-sm">
              <span className="font-medium">Localização:</span> {data.city}, {data.state}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Especialidades:</p>
            <div className="flex flex-wrap gap-1">
              {data.specialties?.map((specialty: string, index: number) => (
                <Badge
                  key={specialty}
                  variant={specialty === data.specialty ? "default" : "secondary"}
                  className="text-xs"
                >
                  {specialty === data.specialty && index === 0 ? `${specialty} (Principal)` : specialty}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experiência com marketing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-4 h-4" />
            Marketing Digital
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm">
              <span className="font-medium">Experiência com tráfego pago:</span>{' '}
              {data.used_paid_traffic === 'never' && 'Nunca usei'}
              {data.used_paid_traffic === 'past' && 'Já usei anteriormente'}
              {data.used_paid_traffic === 'current' && 'Uso atualmente'}
            </p>
          </div>
          {data.platforms?.length > 0 && (
            <div>
              <p className="text-sm font-medium">Plataformas utilizadas:</p>
              <p className="text-sm text-gray-600">{data.platforms.join(', ')}</p>
            </div>
          )}
          {data.expectations && (
            <div>
              <p className="text-sm">
                <span className="font-medium">
                  {data.used_paid_traffic === 'never' ? 'Expectativas:' : 'Resultado anterior:'}
                </span>{' '}
                {data.expectations}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orçamento e objetivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" />
            Orçamento e Objetivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm">
              <span className="font-medium">Investimento mensal:</span>{' '}
              {budgetLabels[data.desired_monthly_spend_range]}
            </p>
          </div>
          <div>
            <p className="text-sm">
              <span className="font-medium">Objetivo principal:</span>{' '}
              {goalLabels[data.main_goal]}
            </p>
          </div>
          <div>
            <p className="text-sm">
              <span className="font-medium">Prazo para início:</span>{' '}
              {timingLabels[data.start_timing]}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="w-4 h-4" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm">
                <Phone className="w-3 h-3 inline mr-1" />
                <span className="font-medium">WhatsApp:</span> {formatWhatsApp(data.whatsapp)}
              </p>
            </div>
            <div>
              <p className="text-sm">
                <Mail className="w-3 h-3 inline mr-1" />
                <span className="font-medium">E-mail:</span> {data.email}
              </p>
            </div>
          </div>
          {data.best_contact_time && (
            <div>
              <p className="text-sm">
                <span className="font-medium">Melhor horário:</span> {data.best_contact_time}
              </p>
            </div>
          )}
          {data.preferred_channel && (
            <div>
              <p className="text-sm">
                <span className="font-medium">Canal preferido:</span> {channelLabels[data.preferred_channel]}
              </p>
            </div>
          )}
          {(data.instagram || data.website) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.instagram && (
                <p className="text-sm">
                  <span className="font-medium">Instagram:</span> {data.instagram}
                </p>
              )}
              {data.website && (
                <p className="text-sm">
                  <span className="font-medium">Site:</span> {data.website}
                </p>
              )}
            </div>
          )}
          {data.notes && (
            <div>
              <p className="text-sm">
                <span className="font-medium">Observações:</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">{data.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consentimento LGPD */}
      <Card className="border-2 border-blue-100">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent"
              checked={data.consent}
              onCheckedChange={(checked) => updateData('consent', checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="consent" className="cursor-pointer text-sm leading-relaxed">
                <span className="font-medium">Autorizo o contato</span> e concordo que meus dados sejam utilizados para:
                <ul className="mt-2 ml-4 space-y-1 text-xs text-gray-600">
                  <li>• Elaboração de proposta personalizada de marketing digital</li>
                  <li>• Contato comercial pelos canais informados</li>
                  <li>• Envio de conteúdos relacionados ao marketing odontológico</li>
                </ul>
                <span className="text-xs text-gray-500 mt-2 block">
                  Seus dados são tratados conforme nossa{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                    Política de Privacidade
                  </a>
                  . Você pode solicitar a exclusão a qualquer momento.
                </span>
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};