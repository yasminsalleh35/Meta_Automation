import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface StepAboutProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const commonSpecialties = [
  'Ortodontia',
  'Implantodontia',
  'Endodontia',
  'Periodontia',
  'Cirurgia Oral',
  'Odontopediatria',
  'Prótese Dentária',
  'Dentística',
  'Radiologia',
  'Clínico Geral'
];

export const StepAbout: React.FC<StepAboutProps> = ({ data, updateData }) => {
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const addSpecialty = (specialty: string) => {
    const currentSpecialties = data.specialties || [];
    if (!currentSpecialties.includes(specialty)) {
      const newSpecialties = [...currentSpecialties, specialty];
      updateData('specialties', newSpecialties);
      
      // Set as main specialty if none selected
      if (!data.specialty) {
        updateData('specialty', specialty);
      }
    }
  };

  const removeSpecialty = (specialty: string) => {
    const newSpecialties = data.specialties.filter((s: string) => s !== specialty);
    updateData('specialties', newSpecialties);
    
    // If removing main specialty, set the first remaining one as main
    if (data.specialty === specialty && newSpecialties.length > 0) {
      updateData('specialty', newSpecialties[0]);
    } else if (newSpecialties.length === 0) {
      updateData('specialty', '');
    }
  };

  const addCustomSpecialty = () => {
    if (customSpecialty.trim()) {
      addSpecialty(customSpecialty.trim());
      setCustomSpecialty('');
      setShowCustomInput(false);
    }
  };

  const setMainSpecialty = (specialty: string) => {
    updateData('specialty', specialty);
  };

  return (
    <div className="space-y-6">
      {/* Nome */}
      <div>
        <Label htmlFor="name">Nome completo *</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => updateData('name', e.target.value)}
          placeholder="Seu nome completo"
          className="mt-1"
        />
      </div>

      {/* Nome da clínica */}
      <div>
        <Label htmlFor="clinic_name">Nome da clínica *</Label>
        <Input
          id="clinic_name"
          value={data.clinic_name}
          onChange={(e) => updateData('clinic_name', e.target.value)}
          placeholder="Nome da sua clínica ou consultório"
          className="mt-1"
        />
      </div>

      {/* Localização */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Cidade *</Label>
          <Input
            id="city"
            value={data.city}
            onChange={(e) => updateData('city', e.target.value)}
            placeholder="Sua cidade"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="state">Estado *</Label>
          <select
            id="state"
            value={data.state}
            onChange={(e) => updateData('state', e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">Selecione o estado</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Especialidades */}
      <div>
        <Label>Especialidades *</Label>
        <p className="text-sm text-gray-500 mb-3">
          Selecione suas especialidades. A primeira será considerada a principal.
        </p>
        
        {/* Selected specialties */}
        {data.specialties && data.specialties.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {data.specialties.map((specialty: string, index: number) => (
              <Badge
                key={specialty}
                variant={specialty === data.specialty ? "default" : "secondary"}
                className="cursor-pointer flex items-center gap-1"
                onClick={() => setMainSpecialty(specialty)}
              >
                {index === 0 && specialty === data.specialty && (
                  <span className="text-xs">Principal:</span>
                )}
                {specialty}
                <X
                  className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSpecialty(specialty);
                  }}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Available specialties */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {commonSpecialties
            .filter(s => !data.specialties?.includes(s))
            .map(specialty => (
              <Button
                key={specialty}
                variant="outline"
                size="sm"
                onClick={() => addSpecialty(specialty)}
                className="text-left justify-start"
              >
                <Plus className="w-3 h-3 mr-1" />
                {specialty}
              </Button>
            ))}
        </div>

        {/* Custom specialty input */}
        {!showCustomInput ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomInput(true)}
            className="text-blue-600"
          >
            <Plus className="w-3 h-3 mr-1" />
            Adicionar especialidade personalizada
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={customSpecialty}
              onChange={(e) => setCustomSpecialty(e.target.value)}
              placeholder="Digite a especialidade"
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addCustomSpecialty();
                }
              }}
            />
            <Button onClick={addCustomSpecialty} size="sm">
              Adicionar
            </Button>
            <Button 
              onClick={() => {
                setShowCustomInput(false);
                setCustomSpecialty('');
              }} 
              variant="outline" 
              size="sm"
            >
              Cancelar
            </Button>
          </div>
        )}

        {data.specialties?.length > 1 && (
          <p className="text-xs text-gray-500 mt-2">
            💡 Clique em uma especialidade para defini-la como principal
          </p>
        )}
      </div>
    </div>
  );
};