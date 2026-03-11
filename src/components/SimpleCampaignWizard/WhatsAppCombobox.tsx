
import React, { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronDown, Phone, Trash2, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWhatsAppHistory } from '@/hooks/useWhatsAppHistory';

interface WhatsAppComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const WhatsAppCombobox: React.FC<WhatsAppComboboxProps> = ({
  value,
  onChange,
  placeholder = "Selecione ou digite um número"
}) => {
  const [open, setOpen] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const { 
    savedNumbers, 
    isLoading, 
    saveNumber, 
    deleteNumber, 
    formatWhatsAppNumber 
  } = useWhatsAppHistory();

  // Proteção defensiva rigorosa - garantir que savedNumbers sempre seja um array válido
  const safeNumbers = React.useMemo(() => {
    if (Array.isArray(savedNumbers)) {
      return savedNumbers.filter(item => item && typeof item === 'object' && item.id && item.number);
    }
    return [];
  }, [savedNumbers]);

  const handleSelectNumber = (selectedNumber: string) => {
    if (selectedNumber && typeof selectedNumber === 'string') {
      onChange(selectedNumber);
      setOpen(false);
    }
  };

  const handleAddNewNumber = async () => {
    if (!newNumber.trim()) return;

    const formatted = formatWhatsAppNumber(newNumber);
    const success = await saveNumber(formatted);
    
    if (success) {
      onChange(formatted);
      setNewNumber('');
      setIsAddingNew(false);
      setOpen(false);
    }
  };

  const handleDeleteNumber = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id && typeof id === 'string') {
      await deleteNumber(id);
    }
  };

  const handleNewNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsAppNumber(e.target.value);
    setNewNumber(formatted);
  };

  // Loading state - mostrar spinner enquanto carrega
  if (isLoading && safeNumbers.length === 0) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-gray-500">Carregando números...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {value || placeholder}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="Buscar número..." 
              disabled={isLoading}
            />
            <CommandEmpty>
              {isLoading ? "Carregando..." : "Nenhum número encontrado."}
            </CommandEmpty>
            
            {safeNumbers.length > 0 && (
              <CommandGroup heading="Números salvos">
                {safeNumbers.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.number}
                    onSelect={() => handleSelectNumber(item.number)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === item.number ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Phone className="h-4 w-4" />
                      {item.number}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteNumber(e, item.id)}
                      className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            <CommandGroup>
              {!isAddingNew ? (
                <CommandItem
                  onSelect={() => setIsAddingNew(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar novo número
                </CommandItem>
              ) : (
                <div className="p-2 space-y-2">
                  <Input
                    placeholder="(11) 99999-9999"
                    value={newNumber}
                    onChange={handleNewNumberChange}
                    maxLength={15}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddNewNumber}
                      disabled={!newNumber.trim() || isLoading}
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingNew(false);
                        setNewNumber('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
