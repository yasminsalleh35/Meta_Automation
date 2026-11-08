
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2 } from 'lucide-react';
import { CampaignTemplate } from '@/types/sectors';

interface TemplatesTabProps {
  campaignTemplates: CampaignTemplate[];
  // ADM-04: edit and delete buttons were not wired.
  onUpdateTemplate: (id: string, updates: Partial<CampaignTemplate>) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
}

interface TemplateFormState {
  title: string;
  description: string;
  targetAudience: string;
  budgetMin: string;
  budgetMax: string;
  isActive: boolean;
}

const toFormState = (template: CampaignTemplate): TemplateFormState => ({
  title: template.title || '',
  description: template.description || '',
  targetAudience: template.targetAudience || '',
  budgetMin: String(template.suggestedBudget?.min ?? ''),
  budgetMax: String(template.suggestedBudget?.max ?? ''),
  isActive: template.isActive,
});

export const TemplatesTab: React.FC<TemplatesTabProps> = ({ campaignTemplates, onUpdateTemplate, onDeleteTemplate }) => {
  const [editingTemplate, setEditingTemplate] = useState<CampaignTemplate | null>(null);
  const [form, setForm] = useState<TemplateFormState | null>(null);
  const [saving, setSaving] = useState(false);

  const openEdit = (template: CampaignTemplate) => {
    setEditingTemplate(template);
    setForm(toFormState(template));
  };

  const closeEdit = () => {
    setEditingTemplate(null);
    setForm(null);
  };

  const budgetMin = form ? Number(form.budgetMin) : NaN;
  const budgetMax = form ? Number(form.budgetMax) : NaN;
  const formValid = !!form
    && form.title.trim().length > 0
    && Number.isFinite(budgetMin) && Number.isFinite(budgetMax)
    && budgetMin >= 0 && budgetMax >= budgetMin;

  const handleSave = async () => {
    if (!editingTemplate || !form || !formValid) return;
    setSaving(true);
    try {
      await onUpdateTemplate(editingTemplate.id, {
        title: form.title.trim(),
        description: form.description,
        targetAudience: form.targetAudience,
        suggestedBudget: { min: budgetMin, max: budgetMax },
        isActive: form.isActive,
      });
      closeEdit();
    } finally {
      setSaving(false);
    }
  };

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
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit(template)} aria-label="Editar template">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" aria-label="Excluir template">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o template "{template.title}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteTemplate(template.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
          {campaignTemplates.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum template cadastrado.</p>
          )}
        </div>
      </CardContent>

      <Dialog open={!!editingTemplate} onOpenChange={(open) => { if (!open) closeEdit(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar template</DialogTitle>
            <DialogDescription>Atualize as informações do template de campanha.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-title">Título</Label>
                <Input
                  id="template-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Descrição</Label>
                <Textarea
                  id="template-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-audience">Público-alvo</Label>
                <Textarea
                  id="template-audience"
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-budget-min">Orçamento mínimo (R$)</Label>
                  <Input
                    id="template-budget-min"
                    type="number"
                    min={0}
                    value={form.budgetMin}
                    onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-budget-max">Orçamento máximo (R$)</Label>
                  <Input
                    id="template-budget-max"
                    type="number"
                    min={0}
                    value={form.budgetMax}
                    onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="template-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                />
                <Label htmlFor="template-active">Ativo</Label>
              </div>
              {!formValid && (
                <p className="text-sm text-destructive">
                  Informe um título e um orçamento válido (mínimo ≤ máximo).
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeEdit}>Cancelar</Button>
            <Button type="button" onClick={handleSave} disabled={!formValid || saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
