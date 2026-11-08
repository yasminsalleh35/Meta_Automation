
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageCircle } from 'lucide-react';
import { normalizeBrPhone } from '@/lib/phone';

interface WhatsAppManualConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (whatsappData: { id: string; name: string; phone: string }) => void;
}

export const WhatsAppManualConfig: React.FC<WhatsAppManualConfigProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');
    
    if (!phone.trim()) {
      setError('Número do WhatsApp é obrigatório');
      return;
    }

    if (!name.trim()) {
      setError('Nome/descrição é obrigatório');
      return;
    }

    // Regra única de normalização (audit CMP-06)
    const normalized = normalizeBrPhone(phone);
    if (!normalized) {
      setError('Número de telefone inválido. Use formato: +5511999999999 ou 11999999999');
      return;
    }
    const formattedPhone = `+${normalized}`;

    const whatsappData = {
      id: `manual_${Date.now()}`,
      name: name.trim(),
      phone: formattedPhone
    };

    onSave(whatsappData);
    
    // Reset form
    setPhone('');
    setName('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setPhone('');
    setName('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <span>Adicionar WhatsApp Business</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription>
              Adicione manualmente um número do WhatsApp Business que você usa para atendimento.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="whatsapp-name">Nome/Descrição *</Label>
            <Input
              id="whatsapp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Atendimento Principal, Vendas, Suporte..."
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="whatsapp-phone">Número do WhatsApp *</Label>
            <Input
              id="whatsapp-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: +5511999999999 ou 11999999999"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: +5511999999999 (com código do país) ou 11999999999
            </p>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            Salvar WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
