import React from 'react';
import { Building2, Bot, Users, ArrowRight } from 'lucide-react';

export const PrecisionAIAnimation: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 lg:p-12">
      {/* Main Message */}
      <div className="text-center mb-8 sm:mb-12">
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 font-medium">
          A IA encontra pacientes para você automaticamente
        </p>
      </div>

      {/* Simple 3-Step Animation */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12">
        
        {/* Step 1: Sua Clínica */}
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-blue-100 rounded-full flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <div className="text-center">
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800">Sua Clínica</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Informações do seu negócio</p>
          </div>
        </div>

        {/* Arrow 1 */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 animate-pulse hidden sm:block" />
          <div className="w-px h-8 bg-blue-500 animate-pulse sm:hidden"></div>
        </div>

        {/* Step 2: IA Camply */}
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-xl animate-pulse">
              <Bot className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-400 rounded-full animate-ping animation-delay-500"></div>
          </div>
          <div className="text-center">
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-blue-600">IA Camply</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Processa e encontra</p>
          </div>
        </div>

        {/* Arrow 2 */}
        <div className="flex items-center">
          <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 animate-pulse hidden sm:block" />
          <div className="w-px h-8 bg-blue-500 animate-pulse sm:hidden"></div>
        </div>

        {/* Step 3: Pacientes */}
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-bounce"></div>
          </div>
          <div className="text-center">
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800">Pacientes</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Interessados na sua clínica</p>
          </div>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="text-center mt-8 sm:mt-12">
        <div className="inline-flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
          <span>Sua clínica</span>
          <ArrowRight className="w-4 h-4" />
          <span>IA Camply</span>
          <ArrowRight className="w-4 h-4" />
          <span>Mais pacientes</span>
        </div>
      </div>
    </div>
  );
};