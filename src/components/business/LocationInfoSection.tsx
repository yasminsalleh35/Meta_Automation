
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

interface LocationInfoSectionProps {
  localData: {
    website: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    logo: File | null;
  };
  onInputChange: (field: string, value: string) => void;
}

const LocationInfoSection: React.FC<LocationInfoSectionProps> = ({
  localData,
  onInputChange
}) => {
  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <MapPin className="w-6 h-6 mr-3 text-red-600" />
          Localização
        </CardTitle>
        <CardDescription className="text-lg">
          Endereço da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="address" className="text-base font-medium">Endereço</Label>
          <Input
            id="address"
            value={localData.address}
            onChange={(e) => onInputChange('address', e.target.value)}
            placeholder="Rua, número, complemento"
            className="h-12 border-0 shadow-md focus:shadow-lg transition-shadow"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-base font-medium">Cidade</Label>
            <Input
              id="city"
              value={localData.city}
              onChange={(e) => onInputChange('city', e.target.value)}
              placeholder="São Paulo"
              className="h-12 border-0 shadow-md focus:shadow-lg transition-shadow"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state" className="text-base font-medium">Estado</Label>
            <Input
              id="state"
              value={localData.state}
              onChange={(e) => onInputChange('state', e.target.value)}
              placeholder="SP"
              className="h-12 border-0 shadow-md focus:shadow-lg transition-shadow"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="zipCode" className="text-base font-medium">CEP</Label>
            <Input
              id="zipCode"
              value={localData.zipCode}
              onChange={(e) => onInputChange('zipCode', e.target.value)}
              placeholder="00000-000"
              className="h-12 border-0 shadow-md focus:shadow-lg transition-shadow"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationInfoSection;
