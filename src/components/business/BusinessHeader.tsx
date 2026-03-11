
import React from 'react';
import { Building2, Award } from 'lucide-react';
import { BusinessData } from '@/hooks/useBusinessSettings';

interface BusinessHeaderProps {
  businessData: BusinessData;
}

const BusinessHeader: React.FC<BusinessHeaderProps> = ({ businessData }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 rounded-2xl p-8 text-white shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-pink-600/20 backdrop-blur-3xl"></div>
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                Meu Negócio
              </h1>
              <p className="text-purple-100 text-lg">Configure as informações do seu negócio para campanhas mais assertivas</p>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
            <Award className="w-12 h-12 text-white mx-auto mb-2" />
            <div className="text-center text-sm">
              <div className="font-bold">Perfil Completo</div>
              <div className="text-purple-200">
                {businessData.name && businessData.description ? '85% concluído' : '25% concluído'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessHeader;
