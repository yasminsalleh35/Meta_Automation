import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Stethoscope, Users, DollarSign, BarChart3, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPECIALTIES } from '@/utils/strategyEngine';
import { SpecialtyTicket } from '@/types/strategy.types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SpecialtiesSectionProps {
  specialties: string[];
  ageMin: number;
  ageMax: number;
  businessName?: string;
  onSpecialtiesChange: (specialties: string[]) => void;
  onAgeChange: (ageMin: number, ageMax: number) => void;
  ticketValues?: Record<string, number>;
  onTicketValuesChange?: (tickets: Record<string, number>) => void;
}

export const SpecialtiesSection: React.FC<SpecialtiesSectionProps> = ({
  specialties,
  ageMin,
  ageMax,
  businessName,
  onSpecialtiesChange,
  onAgeChange,
  ticketValues = {},
  onTicketValuesChange,
}) => {
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState<Record<string, number>>(ticketValues);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  // Sincronizar tickets com props quando mudarem
  useEffect(() => {
    setTickets(ticketValues);
  }, [ticketValues]);

  const selectedSpecialties = SPECIALTIES.filter(spec => specialties.includes(spec.key));

  const handleSpecialtyToggle = (specialty: string) => {
    const newSpecialties = specialties.includes(specialty)
      ? specialties.filter(s => s !== specialty)
      : [...specialties, specialty];
    
    onSpecialtiesChange(newSpecialties);

    // Manter compatibilidade: salvar primeira especialidade no localStorage
    if (newSpecialties.length > 0) {
      localStorage.setItem('selected_specialization', newSpecialties[0]);
      // Disparar evento para compatibilidade
      window.dispatchEvent(new CustomEvent('specializationChanged', { detail: newSpecialties[0] }));
    } else {
      localStorage.removeItem('selected_specialization');
    }
  };

  const handleTicketChange = (specialtyKey: string, value: string) => {
    const numValue = parseFloat(value.replace(/[^\d]/g, '')) || 0;
    const newTickets = { ...tickets, [specialtyKey]: numValue };
    setTickets(newTickets);
    onTicketValuesChange?.(newTickets);
  };

  const handleAgeRangeChange = (value: number[]) => {
    onAgeChange(value[0], value[1]);
  };

  const clearSpecialties = () => {
    onSpecialtiesChange([]);
    const clearedTickets = {};
    setTickets(clearedTickets);
    onTicketValuesChange?.(clearedTickets);
    localStorage.removeItem('selected_specialization');
    
    toast({
      title: "Especialidades limpas",
      description: "Todas as especialidades e valores foram removidos.",
    });
  };

  const generateReport = async () => {
    if (selectedSpecialties.length === 0) {
      toast({
        title: "Selecione especialidades",
        description: "Você deve selecionar pelo menos uma especialidade para gerar o relatório.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        specialties: selectedSpecialties.map(spec => ({
          key: spec.key,
          ticket: tickets[spec.key]
        })) as SpecialtyTicket[],
        ageMin,
        ageMax,
        businessName
      };

      const { data, error } = await supabase.functions.invoke('strategy-report', {
        body: payload
      });

      if (error) throw error;

      toast({
        title: "Relatório gerado!",
        description: "Seu relatório estratégico foi criado com sucesso."
      });

      // Navegar para o relatório gerado
      navigate(`/dashboard/strategy-report/${data.report.id}`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <Stethoscope className="w-6 h-6 mr-3 text-orange-600" />
          Especialidades Odontológicas
        </CardTitle>
        <CardDescription className="text-lg">
          Configure suas especialidades para gerar relatórios estratégicos personalizados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seletor de Especialidades */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium flex items-center">
              <Stethoscope className="w-4 h-4 mr-2 text-orange-600" />
              Especialidades Oferecidas
            </Label>
            {specialties.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar especialidades</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja remover todas as especialidades selecionadas e valores de ticket? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearSpecialties}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Limpar Tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between shadow-md"
              >
                {selectedSpecialties.length === 0
                  ? "Selecione suas especialidades..."
                  : `${selectedSpecialties.length} especialidade(s) selecionada(s)`}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Buscar especialidade..." />
                <CommandList>
                  <CommandEmpty>Nenhuma especialidade encontrada.</CommandEmpty>
                  <CommandGroup>
                    {SPECIALTIES.map((specialty) => (
                      <CommandItem
                        key={specialty.key}
                        value={specialty.key}
                        onSelect={() => handleSpecialtyToggle(specialty.key)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            specialties.includes(specialty.key) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {specialty.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {/* Badges das especialidades selecionadas */}
          {selectedSpecialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedSpecialties.map((specialty) => (
                <Badge
                  key={specialty.key}
                  variant="secondary"
                  className="text-sm px-3 py-1 bg-orange-100 text-orange-800 hover:bg-orange-200"
                >
                  {specialty.label}
                  <X
                    className="ml-2 h-3 w-3 cursor-pointer"
                    onClick={() => handleSpecialtyToggle(specialty.key)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Faixa Etária */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center">
            <Users className="w-4 h-4 mr-2 text-orange-600" />
            Faixa Etária do Público-Alvo
          </Label>
          <div className="px-3 py-2">
            <Slider
              value={[ageMin, ageMax]}
              onValueChange={handleAgeRangeChange}
              min={18}
              max={70}
              step={1}
              className="mb-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{ageMin} anos</span>
              <span>{ageMax} anos</span>
            </div>
          </div>
        </div>

        {/* Ticket Médio por Especialidade */}
        {selectedSpecialties.length > 0 && (
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-orange-600" />
              Ticket Médio por Especialidade (R$)
            </Label>
            <div className="grid gap-3">
              {selectedSpecialties.map((specialty) => (
                <div key={specialty.key} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{specialty.label}</span>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      placeholder="0"
                      value={tickets[specialty.key] || ''}
                      onChange={(e) => handleTicketChange(specialty.key, e.target.value)}
                      className="text-right"
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">
                * Se não informado, será usado um valor de referência no cálculo
              </p>
            </div>
          </div>
        )}

        {/* Botão Gerar Relatório */}
        <div className="pt-4 border-t">
          <Button
            onClick={generateReport}
            disabled={isGenerating || selectedSpecialties.length === 0}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-3 shadow-lg"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            {isGenerating ? 'Gerando Relatório...' : 'Gerar Relatório Estratégico'}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Crie um relatório personalizado com análise de público, orçamento e estratégias recomendadas
          </p>
        </div>
      </CardContent>
    </Card>
  );
};