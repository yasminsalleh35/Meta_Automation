
import { useEffect, useState } from 'react';
import { Phone, MessageCircle } from 'lucide-react';

interface WhatsAppInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  countryCode?: string;
}

const LOCAL_STORAGE_KEY = 'whatsapp_numbers_history';

export const WhatsAppInput: React.FC<WhatsAppInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "11 91234-5678",
  countryCode = "+55"
}) => {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      } catch (e) {
        console.warn('Erro ao carregar histórico de WhatsApp:', e);
      }
    }
  }, []);

  const formatWhatsAppNumber = (input: string) => {
    // Remove tudo que não é número
    const cleaned = input.replace(/\D/g, '');
    
    // Limita a 11 dígitos (DDD + número)
    const limited = cleaned.slice(0, 11);
    
    // Aplica formatação brasileira: (11) 91234-5678
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
    return `${countryCode.replace(/\D/g, '')}${cleaned}`;
  };

  const validateWhatsAppNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    // Valida número brasileiro (11 dígitos)
    return /^\d{11}$/.test(cleaned);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsAppNumber(e.target.value);
    onChange(formatted);
  };

  const handleBlur = () => {
    const cleaned = value.trim();
    if (!cleaned || !validateWhatsAppNumber(cleaned)) return;

    // Adiciona ao histórico se não existir
    if (!history.includes(cleaned)) {
      const updated = [cleaned, ...history].slice(0, 10); // máximo 10 entradas
      setHistory(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const handleHistoryClick = (number: string) => {
    onChange(number);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="whatsapp" className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Phone className="h-4 w-4" />
        Número do WhatsApp
      </label>
      
      <div className="flex gap-2">
        {/* Badge com código do país fixo */}
        <div className="flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium">
          {countryCode}
        </div>
        
        {/* Input para DDD + número */}
        <input
          id="whatsapp"
          type="text"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          maxLength={15}
        />
      </div>
      
      {value && validateWhatsAppNumber(value) && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          Link gerado: <code className="bg-gray-100 px-2 py-1 rounded text-xs">
            https://wa.me/{getFullWhatsAppNumber()}
          </code>
        </p>
      )}

      {history.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Números usados anteriormente:</p>
          <div className="flex flex-wrap gap-2">
            {history.map((num, idx) => (
              <button
                key={idx}
                type="button"
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1"
                onClick={() => handleHistoryClick(num)}
              >
                <Phone className="h-3 w-3" />
                {num}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
