import React, { useState } from 'react';
import { Wallet, Pencil, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { asMoneyBRL } from '@/utils/metricsFormat';
import { BudgetUtils } from '@/services/metaAds/utils/budgetUtils';
import { useCampaignBudgetMutation } from '@/hooks/useCampaignBudgetMutation';

interface CampaignBudgetInlineProps {
  campaignId: string;
  metaAdsetId?: string | null;
  budgetDaily?: number | null;
  disabled?: boolean;
}

/**
 * Compact "daily budget" row shown on the campaign card, with inline editing.
 * Editing calls the `update-campaign-budget` edge function (updates the Meta ad set + DB).
 */
export const CampaignBudgetInline: React.FC<CampaignBudgetInlineProps> = ({
  campaignId,
  metaAdsetId,
  budgetDaily,
  disabled = false,
}) => {
  const { updateBudget, isUpdating } = useCampaignBudgetMutation();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>(budgetDaily != null ? String(budgetDaily) : '');
  const [error, setError] = useState<string | null>(null);

  const canEdit = !!metaAdsetId && !disabled;

  const startEdit = () => {
    setValue(budgetDaily != null ? String(budgetDaily) : '');
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const save = async () => {
    const parsed = Number(String(value).replace(',', '.'));
    const validation = BudgetUtils.validateDailyBudget(parsed);
    if (!validation.isValid) {
      setError(validation.error || 'Valor inválido');
      return;
    }
    if (parsed === budgetDaily) {
      setEditing(false);
      return;
    }
    try {
      await updateBudget({ campaignId, dailyBudget: parsed });
      setEditing(false);
    } catch {
      // toast is handled in the mutation; keep the editor open so the user can retry
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancel();
  };

  return (
    <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-lg bg-muted">
      <div className="flex items-center gap-1.5 min-w-0">
        <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary flex-shrink-0" />
        <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wide">
          Orçamento diário
        </span>
      </div>

      {editing ? (
        <div className="flex items-center gap-1">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">R$</span>
              <Input
                type="number"
                inputMode="decimal"
                min={20}
                step="1"
                value={value}
                autoFocus
                onChange={(e) => { setValue(e.target.value); setError(null); }}
                onKeyDown={onKeyDown}
                disabled={isUpdating}
                className="h-7 w-20 text-right text-xs px-2"
                aria-label="Novo orçamento diário em reais"
              />
            </div>
            {error && <span className="text-[9px] text-red-600 mt-0.5 max-w-[140px] text-right">{error}</span>}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={save} disabled={isUpdating} aria-label="Salvar orçamento">
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={cancel} disabled={isUpdating} aria-label="Cancelar">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] sm:text-sm font-semibold text-foreground">
            {budgetDaily != null ? `${asMoneyBRL(budgetDaily)}/dia` : '—'}
          </span>
          {canEdit ? (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startEdit} aria-label="Editar orçamento diário">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-40" disabled aria-label="Orçamento não editável">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {disabled ? 'Campanha finalizada — orçamento não editável' : 'Orçamento não editável para esta campanha'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );
};
