
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CampaignLoadingState: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Campanhas
                </h1>
                <p className="text-blue-100 text-lg">Carregando suas campanhas...</p>
              </div>
            </div>
          </div>
          <Link to="/dashboard/campaigns/create">
            <Button className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-6 py-3">
              <Plus className="w-5 h-5 mr-2" />
              Nova Campanha
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-gray-50">
        <CardContent className="py-20 text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Carregando campanhas...
          </h3>
          <p className="text-gray-600">
            Aguarde enquanto buscamos suas campanhas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
