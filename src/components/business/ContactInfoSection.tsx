
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Mail, Globe } from 'lucide-react';

interface ContactInfoSectionProps {
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

const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({
  localData,
  onInputChange
}) => {
  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <Phone className="w-6 h-6 mr-3 text-green-600" />
          Informações de Contato
        </CardTitle>
        <CardDescription className="text-lg">
          Como seus clientes podem entrar em contato
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-medium flex items-center">
              <Phone className="w-4 h-4 mr-2 text-green-600" />
              Telefone
            </Label>
            <Input
              id="phone"
              value={localData.phone}
              onChange={(e) => onInputChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
              className="h-12 border-0 shadow-md focus:shadow-lg transition-shadow"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-medium flex items-center">
              <Mail className="w-4 h-4 mr-2 text-blue-600" />
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={localData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              placeholder="contato@suaempresa.com"
              className="h-12 border-0 shadow-md focus:shadow-lg transition-shadow"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="text-base font-medium flex items-center">
            <Globe className="w-4 h-4 mr-2 text-purple-600" />
            Website
          </Label>
          <Input
            id="website"
            value={localData.website}
            onChange={(e) => onInputChange('website', e.target.value)}
            placeholder="https://www.suaempresa.com"
            className="h-12 border-0 shadow-md focus:shadow-lg transition-shadow"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactInfoSection;
