import React, { useState } from 'react';
import { useProfilesList, useToggleActive } from '@/hooks/useCampaignProfiles';
import type { CampaignProfile } from '@/types/campaignProfiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Edit, Eye, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfilesListProps {
  onEdit: (profile: CampaignProfile) => void;
}

export function ProfilesList({ onEdit }: ProfilesListProps) {
  const [search, setSearch] = useState('');
  const { data: profiles, isLoading, error } = useProfilesList({ search });
  const toggleActive = useToggleActive();
  const { toast } = useToast();

  const handleToggleActive = async (profile: CampaignProfile) => {
    try {
      await toggleActive.mutateAsync({
        id: profile.id,
        is_active: !profile.is_active,
      });
      toast({
        title: 'Status atualizado',
        description: `Perfil ${profile.is_active ? 'desativado' : 'ativado'} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao alterar status do perfil.',
        variant: 'destructive',
      });
    }
  };

  const duplicateProfile = (profile: CampaignProfile) => {
    const duplicated = {
      ...profile,
      slug: `${profile.slug}-copy`,
      label: `${profile.label} (Cópia)`,
      id: undefined,
      created_at: undefined,
      updated_at: undefined,
      version: undefined,
    };
    onEdit(duplicated as CampaignProfile);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Carregando perfis...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            Erro ao carregar perfis de campanha
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Perfis de Campanha</span>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar por nome ou slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-80"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!profiles?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            {search ? 'Nenhum perfil encontrado com essa busca' : 'Nenhum perfil criado ainda'}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Faixa Etária</TableHead>
                  <TableHead className="text-center">Gênero</TableHead>
                  <TableHead className="text-center">Posicionamentos</TableHead>
                  <TableHead className="text-center">Interesses</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{profile.label}</div>
                        {profile.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {profile.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {profile.slug}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {profile.age_min}–{profile.age_max}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {profile.genders === 'all' ? 'Todos' : 
                         profile.genders === 'male' ? 'Masculino' : 'Feminino'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {profile.placements_mode === 'automatic' ? 'Automático' : `Manual (${profile.placements.length})`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {profile.interests.length} interesse{profile.interests.length !== 1 ? 's' : ''}
                      </Badge>
                      {profile.enable_language_targeting && profile.languages && profile.languages.length > 0 && (
                        <Badge variant="outline" className="text-xs ml-2">
                          🌐 {profile.languages.length} idioma{profile.languages.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={profile.is_active}
                        onCheckedChange={() => handleToggleActive(profile)}
                        disabled={toggleActive.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(profile)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateProfile(profile)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}