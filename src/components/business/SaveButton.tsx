
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';

interface SaveButtonProps {
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const SaveButton: React.FC<SaveButtonProps> = ({ isSaving, onSubmit }) => {
  return (
    <div className="flex justify-end">
      <Button 
        type="submit" 
        disabled={isSaving}
        onClick={onSubmit}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-3 text-lg"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" />
            Salvar Informações
          </>
        )}
      </Button>
    </div>
  );
};

export default SaveButton;
