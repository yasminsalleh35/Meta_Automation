import React, { useState } from 'react';
import { useMetaInterestSearch } from '@/hooks/useMetaInterestSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Search } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { Interest } from '@/types/campaignProfiles';

interface InterestPickerProps {
  value: Interest[];
  onChange: (value: Interest[]) => void;
}

export function InterestPicker({ value, onChange }: InterestPickerProps) {
  const { search, results, loading, error } = useMetaInterestSearch();
  const [query, setQuery] = useState('');

  const addInterest = (interest: Interest) => {
    if (!value.find(v => v.id === interest.id)) {
      onChange([...value, interest]);
    }
  };

  const removeInterest = (id: string) => {
    onChange(value.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Buscar Interesses do Meta</CardTitle>
          <CardDescription className="text-xs">
            Digite palavras-chave para encontrar interesses reais do Meta Ads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Dentistry, Dental Care, Orthodontics"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && query && search(query)}
            />
            <Button 
              onClick={() => search(query)} 
              disabled={!query || loading}
              size="sm"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
          
          {error && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              ⚠️ Busca indisponível: {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="border rounded-lg p-3 space-y-2">
              <div className="text-sm font-medium">Resultados encontrados:</div>
              <div className="flex flex-wrap gap-2">
                {results.map(result => (
                  <Button
                    key={result.id}
                    variant="outline"
                    size="sm"
                    onClick={() => addInterest({ id: result.id, name: result.name })}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {result.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Inserção Manual (JSON)</CardTitle>
          <CardDescription className="text-xs">
            Caso a busca não esteja disponível, insira os interesses manualmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder='[{"id":"123456789","name":"Dentistry"},{"id":"987654321","name":"Orthodontics"}]'
            className="h-20 text-xs font-mono"
            onBlur={(e) => {
              try {
                const parsed = JSON.parse(e.target.value || '[]');
                if (Array.isArray(parsed)) {
                  const validInterests = parsed.filter(
                    (item): item is Interest => 
                      typeof item === 'object' && 
                      typeof item.id === 'string' && 
                      typeof item.name === 'string'
                  );
                  onChange([...value, ...validInterests.filter(
                    newInterest => !value.some(existing => existing.id === newInterest.id)
                  )]);
                  e.target.value = '';
                }
              } catch {
                // Ignora erros de parsing
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Selected Interests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Interesses Selecionados ({value.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {value.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Nenhum interesse selecionado
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {value.map(interest => (
                <Badge key={interest.id} variant="secondary" className="text-xs">
                  {interest.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-transparent"
                    onClick={() => removeInterest(interest.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}