import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface StepContactProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

const contactTimes = [
  'Manhã (8h às 12h)',
  'Tarde (12h às 18h)',
  'Noite (18h às 22h)',
  'Qualquer horário'
];

const contactChannels = [
  { value: 'whatsapp', label: '💬 WhatsApp', desc: 'Mais prático e rápido' },
  { value: 'phone', label: '📞 Ligação', desc: 'Conversa direta' },
  { value: 'email', label: '📧 E-mail', desc: 'Comunicação formal' },
  { value: 'any', label: '🤝 Qualquer canal', desc: 'Sem preferência' }
];

export const StepContact: React.FC<StepContactProps> = ({ data, updateData }) => {
  const [whatsappFormatted, setWhatsappFormatted] = useState(data.whatsapp || '');

  const formatWhatsApp = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Apply Brazilian phone mask
    if (digits.length <= 2) {
      return `(${digits}`;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatWhatsApp(value);
    setWhatsappFormatted(formatted);
    
    // Store unformatted for submission
    const digits = value.replace(/\D/g, '');
    updateData('whatsapp', digits);
  };

  return (
    <div className="space-y-6">
      {/* WhatsApp */}
      <div>
        <Label htmlFor="whatsapp">WhatsApp *</Label>
        <Input
          id="whatsapp"
          value={whatsappFormatted}
          onChange={handleWhatsAppChange}
          placeholder="(11) 99999-9999"
          className="mt-1"
          maxLength={15}
        />
        <p className="text-xs text-gray-500 mt-1">
          Número com DDD para contato via WhatsApp
        </p>
      </div>

      {/* E-mail */}
      <div>
        <Label htmlFor="email">E-mail *</Label>
        <Input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => updateData('email', e.target.value)}
          placeholder="seuemail@exemplo.com"
          className="mt-1"
        />
      </div>

      {/* Melhor horário */}
      <div>
        <Label className="text-base font-medium">
          Qual o melhor horário para contato?
        </Label>
        <div className="space-y-2 mt-3">
          {contactTimes.map(time => (
            <div key={time} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`time-${time}`}
                name="contact_time"
                value={time}
                checked={data.best_contact_time === time}
                onChange={(e) => updateData('best_contact_time', e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <Label htmlFor={`time-${time}`} className="cursor-pointer text-sm">
                {time}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Canal preferido */}
      <div>
        <Label className="text-base font-medium">
          Como você prefere ser contatado?
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {contactChannels.map(channel => (
            <Card 
              key={channel.value}
              className={`cursor-pointer transition-all ${data.preferred_channel === channel.value ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'}`}
              onClick={() => updateData('preferred_channel', channel.value)}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${data.preferred_channel === channel.value ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                  <div>
                    <p className="font-medium text-sm">{channel.label}</p>
                    <p className="text-xs text-gray-600">{channel.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Links opcionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="instagram">Instagram (opcional)</Label>
          <Input
            id="instagram"
            value={data.instagram}
            onChange={(e) => updateData('instagram', e.target.value)}
            placeholder="@suaclinica"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="website">Site (opcional)</Label>
          <Input
            id="website"
            type="url"
            value={data.website}
            onChange={(e) => updateData('website', e.target.value)}
            placeholder="https://suaclinica.com"
            className="mt-1"
          />
        </div>
      </div>

      {/* Observações */}
      <div>
        <Label htmlFor="notes">Observações adicionais (opcional)</Label>
        <Textarea
          id="notes"
          value={data.notes}
          onChange={(e) => updateData('notes', e.target.value)}
          placeholder="Algo específico sobre sua clínica ou objetivos que gostaria de compartilhar..."
          className="mt-1"
          rows={3}
        />
      </div>
    </div>
  );
};