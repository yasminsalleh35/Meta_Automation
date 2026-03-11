
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Star, Sparkles } from 'lucide-react';

const SupportSection: React.FC = () => {
  return (
    <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 shadow-xl">
      <CardContent className="pt-8 pb-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-2xl opacity-30 rounded-full"></div>
              <div className="relative p-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Precisa de Ajuda?
            </h3>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-lg">
              Nossa equipe especializada está pronta para ajudar você a encontrar a melhor solução 
              para impulsionar o seu negócio com marketing digital inteligente.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:bg-slate-800/80 dark:border-blue-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <MessageCircle className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
              Falar com Vendas
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:bg-slate-800/80 dark:border-purple-700 dark:hover:border-purple-600 dark:hover:bg-purple-900/20 transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <Star className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
              Central de Ajuda
            </Button>
          </div>
          
          <div className="flex items-center justify-center space-x-2 pt-4">
            <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Suporte especializado em marketing digital e IA
            </p>
            <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportSection;
