import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle2 } from 'lucide-react';

interface ScheduleSlot {
  time: string;
  patient?: {
    name: string;
    procedure: string;
    type: 'consultation' | 'treatment' | 'cleaning';
  };
  filled: boolean;
}

const initialSchedule: ScheduleSlot[] = [
  { time: '08:00', filled: false },
  { time: '09:00', filled: false },
  { time: '10:00', filled: false },
  { time: '11:00', filled: false },
  { time: '14:00', filled: false },
  { time: '15:00', filled: false },
  { time: '16:00', filled: false },
  { time: '17:00', filled: false },
];

const patients = [
  { name: 'Maria Silva', procedure: 'Limpeza', type: 'cleaning' as const },
  { name: 'João Santos', procedure: 'Consulta', type: 'consultation' as const },
  { name: 'Ana Costa', procedure: 'Obturação', type: 'treatment' as const },
  { name: 'Pedro Lima', procedure: 'Avaliação', type: 'consultation' as const },
  { name: 'Clara Rocha', procedure: 'Clareamento', type: 'treatment' as const },
  { name: 'Lucas Dias', procedure: 'Limpeza', type: 'cleaning' as const },
  { name: 'Sofia Mendes', procedure: 'Canal', type: 'treatment' as const },
  { name: 'Bruno Alves', procedure: 'Consulta', type: 'consultation' as const },
];

export const DentistScheduleAnimation: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(initialSchedule);
  const [currentPhase, setCurrentPhase] = useState<'empty' | 'filling' | 'full'>('empty');
  const [filledCount, setFilledCount] = useState(0);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const phases = [
      { phase: 'empty' as const, duration: 3000 },
      { phase: 'filling' as const, duration: 5000 },
      { phase: 'full' as const, duration: 4000 },
    ];

    let phaseIndex = 0;
    let slotIndex = 0;

    const cycle = () => {
      const currentPhaseConfig = phases[phaseIndex];
      setCurrentPhase(currentPhaseConfig.phase);

      if (currentPhaseConfig.phase === 'empty') {
        setSchedule(initialSchedule);
        setFilledCount(0);
        setShowStats(false);
      } else if (currentPhaseConfig.phase === 'filling') {
        const fillInterval = setInterval(() => {
          if (slotIndex < schedule.length) {
            setSchedule(prev => 
              prev.map((slot, index) => {
                if (index === slotIndex) {
                  return {
                    ...slot,
                    filled: true,
                    patient: patients[index]
                  };
                }
                return slot;
              })
            );
            setFilledCount(slotIndex + 1);
            slotIndex++;
          } else {
            clearInterval(fillInterval);
            setShowStats(true);
          }
        }, 600);

        setTimeout(() => {
          clearInterval(fillInterval);
        }, currentPhaseConfig.duration);
      } else if (currentPhaseConfig.phase === 'full') {
        setShowStats(true);
      }

      setTimeout(() => {
        phaseIndex = (phaseIndex + 1) % phases.length;
        if (phaseIndex === 0) {
          slotIndex = 0;
        }
        cycle();
      }, currentPhaseConfig.duration);
    };

    cycle();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'treatment': return 'bg-green-100 text-green-700 border-green-200';
      case 'cleaning': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6" style={{ minHeight: '600px' }}>
      {/* Status Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Calendar className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">
            {currentPhase === 'empty' && 'Sem Camply: Agenda vazia'}
            {currentPhase === 'filling' && 'Com Camply: Pacientes chegando...'}
            {currentPhase === 'full' && 'Resultado: Consultório lotado!'}
          </h3>
        </div>
        
        {/* Always reserve space for stats to prevent layout shift */}
        <div className="flex justify-center gap-6 text-sm" style={{ minHeight: '24px' }}>
          {showStats && (
            <>
              <div className="flex items-center gap-2 text-green-600 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">{filledCount}/8 horários preenchidos</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600 animate-fade-in">
                <User className="w-4 h-4" />
                <span className="font-medium">+{filledCount * 150}% de pacientes</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {schedule.map((slot, index) => (
            <div
              key={slot.time}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-500
                ${slot.filled 
                  ? `${getTypeColor(slot.patient?.type || '')} animate-fade-in` 
                  : 'bg-muted border-muted-foreground/20 border-dashed'
                }
              `}
              style={{
                minHeight: '120px', // Fixed height to prevent layout shift
                animationDelay: currentPhase === 'filling' ? `${index * 600}ms` : '0ms'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium text-sm">{slot.time}</span>
              </div>
              
              {/* Always reserve space for patient info */}
              <div style={{ minHeight: '40px' }}>
                {slot.filled && slot.patient ? (
                  <div className="animate-fade-in">
                    <p className="font-semibold text-sm mb-1">{slot.patient.name}</p>
                    <p className="text-xs opacity-75">{slot.patient.procedure}</p>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-xs">
                    Disponível
                  </div>
                )}
              </div>
              
              {/* Check circle with transform-only animation */}
              {slot.filled && (
                <div className="absolute -top-1 -right-1">
                  <CheckCircle2 className="w-5 h-5 text-green-500 bg-background rounded-full animate-fade-in" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progress Indicator - Always reserve space to prevent layout shift */}
      <div className="mt-6" style={{ minHeight: '60px' }}>
        {currentPhase === 'filling' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Preenchendo agenda...</span>
              <span className="text-sm font-medium text-primary">{filledCount}/8</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ width: `${(filledCount / 8) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};