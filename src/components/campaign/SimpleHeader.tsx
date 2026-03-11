
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SimpleHeaderProps {
  title: string;
  description?: string;
}

export const SimpleHeader: React.FC<SimpleHeaderProps> = ({
  title,
  description
}) => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
      <div className="relative z-10 flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            {title}
          </h1>
          {description && (
            <p className="text-blue-100 text-lg">{description}</p>
          )}
        </div>
        <Button 
          onClick={() => navigate('/dashboard/campaigns')}
          className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-6 py-3"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
      </div>
    </div>
  );
};
