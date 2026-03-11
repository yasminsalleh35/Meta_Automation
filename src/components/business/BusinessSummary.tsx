import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Building, Target, Package, Tag, Goal, BarChart3, Stethoscope } from 'lucide-react';
import { BusinessData } from '@/hooks/useBusinessSettings';
import { CampaignProfile } from '@/types/campaignProfiles';

interface BusinessSummaryProps {
  businessData: BusinessData;
  selectedProfile?: CampaignProfile | null;
  onEdit: () => void;
}

export const BusinessSummary: React.FC<BusinessSummaryProps> = ({
  businessData,
  selectedProfile,
  onEdit
}) => {
  const hasBasicInfo = businessData.name || businessData.description || businessData.mainProduct || businessData.category;
  const hasTargeting = businessData.targetAudience || businessData.businessGoals;
  const hasSpecialties = businessData.odontSpecialties?.length > 0;

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configurações do Negócio</h2>
          <p className="text-muted-foreground">Resumo das informações cadastradas</p>
        </div>
        <Button onClick={onEdit} className="flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Editar
        </Button>
      </div>

      {/* Campaign Profile */}
      {selectedProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Perfil de Campanha Selecionado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-semibold">{selectedProfile.label}</div>
              {selectedProfile.description && (
                <p className="text-muted-foreground text-sm">{selectedProfile.description}</p>
              )}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">Idade: {selectedProfile.age_min}-{selectedProfile.age_max} anos</Badge>
                <Badge variant="outline">Gênero: {selectedProfile.genders === 'all' ? 'Todos' : selectedProfile.genders === 'male' ? 'Masculino' : 'Feminino'}</Badge>
                {selectedProfile.show_strategic_reports && <Badge className="bg-orange-100 text-orange-800">Relatórios Estratégicos</Badge>}
                {selectedProfile.show_dental_specialties && <Badge className="bg-blue-100 text-blue-800">Especialidades Odontológicas</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Business Info */}
      {hasBasicInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businessData.name && (
              <div>
                <div className="font-medium text-sm text-muted-foreground">Nome do Negócio</div>
                <div className="font-semibold">{businessData.name}</div>
              </div>
            )}
            {businessData.category && (
              <div>
                <div className="font-medium text-sm text-muted-foreground">Categoria</div>
                <div className="font-semibold">{businessData.category}</div>
              </div>
            )}
            {businessData.mainProduct && (
              <div className="md:col-span-2">
                <div className="font-medium text-sm text-muted-foreground">Produto/Serviço Principal</div>
                <div className="font-semibold">{businessData.mainProduct}</div>
              </div>
            )}
            {businessData.description && (
              <div className="md:col-span-2">
                <div className="font-medium text-sm text-muted-foreground">Descrição do Negócio</div>
                <div className="font-semibold">{businessData.description}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Marketing Strategy */}
      {hasTargeting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Estratégia de Marketing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessData.targetAudience && (
              <div>
                <div className="font-medium text-sm text-muted-foreground">Público-Alvo</div>
                <div className="font-semibold">{businessData.targetAudience}</div>
              </div>
            )}
            {businessData.businessGoals && (
              <div>
                <div className="font-medium text-sm text-muted-foreground">Objetivos do Negócio</div>
                <div className="font-semibold">{businessData.businessGoals}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dental Specialties (only if profile allows) */}
      {selectedProfile?.show_dental_specialties && hasSpecialties && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-orange-600" />
              Especialidades Odontológicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Especialidades Selecionadas</div>
              <div className="flex gap-2 flex-wrap">
                {businessData.odontSpecialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="bg-orange-100 text-orange-800">
                    {specialty}
                  </Badge>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                Faixa etária: {businessData.targetAgeMin}-{businessData.targetAgeMax} anos
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategic Reports Section (only if profile allows) */}
      {selectedProfile?.show_strategic_reports && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              Relatórios Estratégicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">
              Funcionalidade habilitada para este perfil de campanha.
              Configure suas especialidades para gerar relatórios estratégicos personalizados.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hasBasicInfo && !hasTargeting && !hasSpecialties && (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma informação cadastrada ainda. Clique em "Editar" para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};