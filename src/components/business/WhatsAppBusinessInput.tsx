import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WhatsAppBusinessInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const WhatsAppBusinessInput: React.FC<WhatsAppBusinessInputProps> = ({ 
  value, 
  onChange 
}) => {
  const formatWhatsAppNumber = (input: string) => {
    const cleaned = input.replace(/\D/g, '');
    const limited = cleaned.slice(0, 11);
    
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
  };

  const getFullWhatsAppNumber = () => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 11 ? `55${cleaned}` : '';
  };

  const validateWhatsAppNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    return /^\d{11}$/.test(cleaned);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsAppNumber(e.target.value);
    onChange(formatted);
  };

  const isValid = validateWhatsAppNumber(value);
  const fullNumber = getFullWhatsAppNumber();

  return (
    <div className="space-y-3">
      <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
        <Phone className="h-4 w-4" />
        WhatsApp do Negócio
      </Label>
      
      <div className="flex gap-2">
        <div className="flex items-center px-3 py-2 bg-muted border border-border rounded-md text-sm font-medium">
          +55
        </div>
        
        <Input
          id="whatsapp_number"
          type="text"
          placeholder="(11) 91234-5678"
          value={value}
          onChange={handleInputChange}
          maxLength={15}
          className="flex-1"
        />
      </div>

      {value && isValid && (
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-sm text-green-700 dark:text-green-300">
            <strong>Link wa.me gerado:</strong>
            <code className="ml-2 bg-background px-2 py-1 rounded text-xs">
              https://wa.me/{fullNumber}
            </code>
          </AlertDescription>
        </Alert>
      )}

      {value && !isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Número inválido. Digite no formato: (XX) XXXXX-XXXX
          </AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        💡 Este número será usado como padrão em suas campanhas e para criação automática via wa.me
      </p>
    </div>
  );
};
