import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CampaignProfile {
  id: string;
  label: string;
  description?: string;
}

interface CampaignProfileSelectorProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
}

export const CampaignProfileSelector: React.FC<CampaignProfileSelectorProps> = ({
  value,
  onValueChange
}) => {
  const [profiles, setProfiles] = useState<CampaignProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('campaign_profiles')
          .select('id, label, description')
          .eq('is_active', true)
          .order('label');

        if (error) throw error;

        setProfiles(data || []);
      } catch (error) {
        console.error('Error loading campaign profiles:', error);
        toast({
          title: "Erro ao carregar perfis",
          description: "Não foi possível carregar os perfis de campanha disponíveis.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfiles();
  }, [toast]);

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === 'none') {
      onValueChange(null);
    } else {
      onValueChange(selectedValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="campaign-profile">Perfil de Campanha</Label>
      <Select 
        value={value || 'none'} 
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger id="campaign-profile">
          <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione um perfil de campanha"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Nenhum perfil selecionado</SelectItem>
          {profiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              <div className="flex flex-col">
                <span className="font-medium">{profile.label}</span>
                {profile.description && (
                  <span className="text-sm text-muted-foreground">{profile.description}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <p className="text-sm text-muted-foreground">
          Este perfil otimizará automaticamente as configurações de segmentação das suas campanhas.
        </p>
      )}
    </div>
  );
};