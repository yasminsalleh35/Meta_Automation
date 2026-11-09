import React, { useState } from 'react';
import { LeadsHeader } from '@/components/admin/leads/LeadsHeader';
import { LeadsFilters } from '@/components/admin/leads/LeadsFilters';
import { LeadsTable } from '@/components/admin/leads/LeadsTable';
import { LeadDrawer } from '@/components/admin/leads/LeadDrawer';
import { useLeads, type Lead } from '@/hooks/admin/useLeads';
import { AdminPagination } from '@/components/admin/AdminPagination';

const AdminLeads: React.FC = () => {
  // Audit ADM-03: página atual + total vindos do servidor; filtros/métricas também no servidor
  const {
    leads, totalCount, page, pageSize, goToPage, filterOptions, loading, filters, setFilters,
    updateLead, addComment, fetchAllFilteredLeads, metrics,
  } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedLead(null);
  };

  const handleLeadUpdate = async (leadId: string, updates: any): Promise<boolean> => {
    const success = await updateLead(leadId, updates);
    if (success && selectedLead && selectedLead.id === leadId) {
      // Refresh the selected lead data
      const updatedLead = leads.find(l => l.id === leadId);
      if (updatedLead) {
        setSelectedLead(updatedLead);
      }
    }
    return success;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Leads</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie os leads capturados pelo quiz de avaliação
        </p>
      </div>

      <LeadsHeader metrics={metrics} fetchAllLeads={fetchAllFilteredLeads} />
      
      <LeadsFilters 
        filters={filters}
        onFiltersChange={setFilters}
        // ADM-05: opções vêm de todos os leads, não só dos já filtrados
        options={filterOptions}
        resultCount={totalCount}
      />

      <LeadsTable
        leads={leads}
        loading={loading}
        onLeadSelect={handleLeadSelect}
        onLeadUpdate={handleLeadUpdate}
      />

      <AdminPagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={goToPage}
        disabled={loading}
      />

      <LeadDrawer
        lead={selectedLead}
        open={isDrawerOpen}
        onClose={handleDrawerClose}
        onLeadUpdate={handleLeadUpdate}
        onAddComment={addComment}
      />
    </div>
  );
};

export default AdminLeads;