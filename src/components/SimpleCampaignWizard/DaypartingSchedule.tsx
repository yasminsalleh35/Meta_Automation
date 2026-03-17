import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Calendar, AlertTriangle } from 'lucide-react';

interface DaypartingScheduleProps {
  enabled: boolean;
  startTime: string | null;
  endTime: string | null;
  selectedDays: number[];
  hasEndDate: boolean;
  onToggle: (enabled: boolean) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onDaysChange: (days: number[]) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0');
  return { value: `${h}:00`, label: `${h}:00` };
});

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

export const DaypartingSchedule: React.FC<DaypartingScheduleProps> = ({
  enabled,
  startTime,
  endTime,
  selectedDays,
  hasEndDate,
  onToggle,
  onStartTimeChange,
  onEndTimeChange,
  onDaysChange,
}) => {
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        onDaysChange(selectedDays.filter(d => d !== day));
      }
    } else {
      onDaysChange([...selectedDays, day].sort());
    }
  };

  const selectAllDays = () => {
    onDaysChange([0, 1, 2, 3, 4, 5, 6]);
  };

  const selectWeekdays = () => {
    onDaysChange([1, 2, 3, 4, 5]);
  };

  const selectWeekends = () => {
    onDaysChange([0, 6]);
  };

  const getScheduleSummary = (): string => {
    if (!enabled) return '';

    const timeRange = `${startTime || '00:00'} - ${endTime || '23:00'}`;

    if (selectedDays.length === 7) return `Todos os dias, ${timeRange}`;
    if (selectedDays.length === 5 && !selectedDays.includes(0) && !selectedDays.includes(6)) {
      return `Dias úteis, ${timeRange}`;
    }
    if (selectedDays.length === 2 && selectedDays.includes(0) && selectedDays.includes(6)) {
      return `Fins de semana, ${timeRange}`;
    }

    const dayLabels = selectedDays.map(d => DAYS_OF_WEEK.find(dw => dw.value === d)?.label).join(', ');
    return `${dayLabels}, ${timeRange}`;
  };

  return (
    <Card className="w-full border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Programação de Horário</CardTitle>
          </div>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
        <CardDescription className="text-sm">
          {enabled
            ? 'Seus anúncios serão exibidos apenas nos horários e dias selecionados.'
            : 'Seus anúncios serão exibidos 24 horas por dia, todos os dias.'}
        </CardDescription>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4">
          {/* Time Range Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Horário de Início</Label>
              <Select value={startTime || '08:00'} onValueChange={onStartTimeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Início" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map(h => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Horário de Término</Label>
              <Select value={endTime || '22:00'} onValueChange={onEndTimeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Término" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map(h => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Day Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Dias da Semana
              </Label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={selectAllDays}
                  className="text-xs text-primary hover:underline"
                >
                  Todos
                </button>
                <span className="text-xs text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={selectWeekdays}
                  className="text-xs text-primary hover:underline"
                >
                  Úteis
                </button>
                <span className="text-xs text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={selectWeekends}
                  className="text-xs text-primary hover:underline"
                >
                  Fim de semana
                </button>
              </div>
            </div>
            <div className="flex gap-1.5">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`flex-1 py-2 px-1 text-xs font-medium rounded-md border transition-colors ${
                    selectedDays.includes(day.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  }`}
                  title={day.fullLabel}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Validation warnings */}
          {!hasEndDate && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                A programação de horário requer uma <strong>data de término</strong>. Defina uma data de término acima para usar este recurso.
              </p>
            </div>
          )}

          {startTime && endTime && parseInt(startTime.split(':')[0], 10) >= parseInt(endTime.split(':')[0], 10) && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-400">
                O horário de início deve ser <strong>anterior</strong> ao horário de término.
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              Resumo: <span className="font-medium text-foreground">{getScheduleSummary()}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fuso horário da conta de anúncios (configurado no Meta Business).
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
