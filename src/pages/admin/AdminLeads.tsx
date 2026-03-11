import React, { useState } from 'react';
import { LeadsHeader } from '@/components/admin/leads/LeadsHeader';
import { LeadsFilters } from '@/components/admin/leads/LeadsFilters';
import { LeadsTable } from '@/components/admin/leads/LeadsTable';
import { LeadDrawer } from '@/components/admin/leads/LeadDrawer';
import { useLeads, type Lead } from '@/hooks/admin/useLeads';

const AdminLeads: React.FC = () => {
  const { leads, loading, filters, setFilters, updateLead, addComment, refreshLeads, metrics } = useLeads();
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

      <LeadsHeader metrics={metrics} leads={leads} />
      
      <LeadsFilters 
        filters={filters}
        onFiltersChange={setFilters}
        leads={leads}
      />

      <LeadsTable
        leads={leads}
        loading={loading}
        onLeadSelect={handleLeadSelect}
        onLeadUpdate={handleLeadUpdate}
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