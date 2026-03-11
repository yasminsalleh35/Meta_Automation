import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { zCampaignProfileForm } from '@/schemas/campaignProfiles';
import { PlacementsSelector } from './PlacementsSelector';
import { InterestPicker } from './InterestPicker';
import { LanguageSelector } from './LanguageSelector';
import type { Interest, PlacementType } from '@/types/campaignProfiles';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

type FormData = z.infer<typeof zCampaignProfileForm>;

interface ProfileFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
}

export function ProfileFormDrawer({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: ProfileFormDrawerProps) {
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(zCampaignProfileForm),
    defaultValues: {
      slug: '',
      label: '',
      description: '',
      age_min: 18,
      age_max: 65,
      genders: 'all',
      placements_mode: 'automatic',
      placements: [],
      interests: [],
      is_active: true,
      show_strategic_reports: false,
      show_dental_specialties: false,
      enable_language_targeting: false,
      languages: [],
    },
  });

  useEffect(() => {
    if (initial) {
      reset({
        slug: initial.slug || '',
        label: initial.label || '',
        description: initial.description || '',
        age_min: initial.age_min || 18,
        age_max: initial.age_max || 65,
        genders: initial.genders || 'all',
        placements_mode: initial.placements_mode || 'automatic',
        placements: (initial.placements as PlacementType[]) || [],
        interests: Array.isArray(initial.interests) ? initial.interests.filter((i): i is Interest => i && typeof i.id === 'string' && typeof i.name === 'string') : [],
        is_active: initial.is_active !== undefined ? initial.is_active : true,
        show_strategic_reports: initial.show_strategic_reports || false,
        show_dental_specialties: initial.show_dental_specialties || false,
        enable_language_targeting: initial.enable_language_targeting || false,
        languages: initial.languages || [],
      });
    } else {
      reset({
        slug: '',
        label: '',
        description: '',
        age_min: 18,
        age_max: 65,
        genders: 'all',
        placements_mode: 'automatic',
        placements: [],
        interests: [],
        is_active: true,
        show_strategic_reports: false,
        show_dental_specialties: false,
        enable_language_targeting: false,
        languages: [],
      });
    }
  }, [initial, reset]);

  const placementsMode = watch('placements_mode');
  const placements = watch('placements');
  const interests = watch('interests');
  const isActive = watch('is_active');
  const enableLanguageTargeting = watch('enable_language_targeting');
  const languages = watch('languages');
  const showStrategicReports = watch('show_strategic_reports');
  const showDentalSpecialties = watch('show_dental_specialties');

  const handleFormSubmit = handleSubmit(async (data) => {
    if (data.age_min > data.age_max) {
      toast({
        title: 'Erro de validação',
        description: 'A idade mínima não pode ser maior que a idade máxima.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSubmit(data);
      toast({
        title: 'Sucesso',
        description: initial?.slug ? 'Perfil atualizado com sucesso!' : 'Perfil criado com sucesso!',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar o perfil. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {initial?.slug ? 'Editar Perfil de Campanha' : 'Novo Perfil de Campanha'}
          </SheetTitle>
          <SheetDescription>
            Configure as características de targeting que serão aplicadas automaticamente nas campanhas.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleFormSubmit} className="space-y-6 mt-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="ex: dentista-premium"
                  disabled={!!initial?.slug}
                />
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Nome do Perfil *</Label>
                <Input
                  id="label"
                  {...register('label')}
                  placeholder="ex: Dentista Premium"
                />
                {errors.label && (
                  <p className="text-sm text-destructive">{errors.label.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descreva as características deste perfil..."
                rows={3}
              />
            </div>
          </div>

          {/* Demographics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Demografia</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age_min">Idade Mínima</Label>
                <Input
                  id="age_min"
                  type="number"
                  min="13"
                  max="65"
                  {...register('age_min', { valueAsNumber: true })}
                />
                {errors.age_min && (
                  <p className="text-sm text-destructive">{errors.age_min.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age_max">Idade Máxima</Label>
                <Input
                  id="age_max"
                  type="number"
                  min="13"
                  max="65"
                  {...register('age_max', { valueAsNumber: true })}
                />
                {errors.age_max && (
                  <p className="text-sm text-destructive">{errors.age_max.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="genders">Gênero</Label>
                <Select
                  value={watch('genders')}
                  onValueChange={(value) => setValue('genders', value as 'all' | 'male' | 'female')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Placements */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Posicionamentos</h3>
            
            <div className="space-y-2">
              <Label>Modo de Posicionamento</Label>
              <Select
                value={placementsMode}
                onValueChange={(value) => setValue('placements_mode', value as 'automatic' | 'manual')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automático (padrão do sistema)</SelectItem>
                  <SelectItem value="manual">Manual (selecionar abaixo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {placementsMode === 'manual' && (
              <div className="space-y-2">
                <Label>Posicionamentos Específicos</Label>
                <PlacementsSelector
                  value={placements}
                  onChange={(value) => setValue('placements', value, { shouldDirty: true })}
                />
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Interesses</h3>
            <InterestPicker
              value={interests as Interest[]}
              onChange={(value) => setValue('interests', value, { shouldDirty: true })}
            />
          </div>

          {/* Language Targeting */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Language Targeting (Idiomas)</h3>
            
            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
              <Switch
                id="enable_language_targeting"
                checked={enableLanguageTargeting}
                onCheckedChange={(checked) => {
                  setValue('enable_language_targeting', checked);
                  if (!checked) {
                    setValue('languages', []);
                  }
                }}
              />
              <Label htmlFor="enable_language_targeting" className="cursor-pointer">
                Ativar Language Targeting (restringir idiomas dos usuários)
              </Label>
            </div>

            {enableLanguageTargeting && (
              <div className="space-y-2">
                <LanguageSelector
                  value={languages || []}
                  onChange={(value) => setValue('languages', value, { shouldDirty: true })}
                />
              </div>
            )}

            {!enableLanguageTargeting && (
              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                ℹ️ Language Targeting desativado: Campanhas não terão restrição de idioma (comportamento padrão do Meta)
              </div>
            )}
          </div>

          {/* Status & Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configurações Avançadas</h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
              <Label htmlFor="is_active">Perfil ativo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show_strategic_reports"
                checked={showStrategicReports}
                onCheckedChange={(checked) => setValue('show_strategic_reports', checked)}
              />
              <Label htmlFor="show_strategic_reports">Mostrar seção "Relatórios Estratégicos" no "Meu Negócio"</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show_dental_specialties"
                checked={showDentalSpecialties}
                onCheckedChange={(checked) => setValue('show_dental_specialties', checked)}
              />
              <Label htmlFor="show_dental_specialties">Mostrar seção "Especialidades Odontológicas" no "Meu Negócio"</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}