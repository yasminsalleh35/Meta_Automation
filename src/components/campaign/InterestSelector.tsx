
import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getDynamicSuggestions } from '@/utils/interestSuggestions';

interface InterestSelectorProps {
  interests: string[];
  aiSuggestions?: { interests: string[] } | null;
  onAddInterest: (interest: string) => void;
  onRemoveInterest: (interest: string) => void;
}

export const InterestSelector: React.FC<InterestSelectorProps> = ({
  interests,
  aiSuggestions,
  onAddInterest,
  onRemoveInterest
}) => {
  const dynamicSuggestions = getDynamicSuggestions(interests);

  return (
    <div>
      <Label>Interesses</Label>
      <div className="mt-2 space-y-3">
        {/* Interesses selecionados */}
        {interests.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Selecionados:</p>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge 
                  key={interest} 
                  variant="default" 
                  className="cursor-pointer hover:bg-red-100 bg-blue-600"
                  onClick={() => onRemoveInterest(interest)}
                >
                  {interest} ×
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sugestões dinâmicas */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            {interests.length === 0 ? 'Selecione seus interesses:' : 'Interesses relacionados:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {dynamicSuggestions.map((suggestion) => (
              <Badge 
                key={suggestion} 
                variant="outline" 
                className="cursor-pointer hover:bg-blue-50 border-blue-300"
                onClick={() => onAddInterest(suggestion)}
              >
                + {suggestion}
              </Badge>
            ))}
          </div>
        </div>

        {/* Sugestões da IA */}
        {aiSuggestions && aiSuggestions.interests.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              🤖 Sugestões da IA baseadas no seu negócio:
            </p>
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.interests
                .filter((interest: string) => !interests.includes(interest))
                .map((interest: string) => (
                  <Badge 
                    key={interest} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-blue-100 border-blue-400 bg-blue-50"
                    onClick={() => onAddInterest(interest)}
                  >
                    + {interest}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
