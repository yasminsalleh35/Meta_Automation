import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  page: number; // 0-based
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

// ADM-03: paginação no servidor para as listas do admin (antes paravam em 1.000 linhas).
export const AdminPagination: React.FC<AdminPaginationProps> = ({ page, pageSize, totalCount, onPageChange, disabled }) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalCount <= pageSize) return null;
  const from = page * pageSize + 1;
  const to = Math.min(totalCount, (page + 1) * pageSize);

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        {from}–{to} de {totalCount}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {page + 1} de {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
