
import React from 'react';
import { Users } from 'lucide-react';

export const EmptyProfilesState: React.FC = () => {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>Nenhum perfil de setor cadastrado</p>
      <p className="text-sm">Crie perfis detalhados para otimizar as campanhas de IA</p>
    </div>
  );
};
