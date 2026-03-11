
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { CampaignTemplate } from '@/types/sectors';

interface TemplatesTabProps {
  campaignTemplates: CampaignTemplate[];
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({ campaignTemplates }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates de Campanhas</CardTitle>
        <CardDescription>Gerencie templates pré-configurados por setor</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {campaignTemplates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{template.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{template.objective}</Badge>
                    <Badge variant="outline">
                      R$ {template.suggestedBudget.min} - R$ {template.suggestedBudget.max}
                    </Badge>
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
