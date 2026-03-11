export type CampaignSummary = {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'disabled';
  objective?: string;           // ex: 'traffic' | 'leads'
  dailyBudget?: number;         // em BRL
  reach?: number;
  clicks?: number;
  spend?: number;               // em BRL
  cpa?: number;                 // em BRL
  // Extended for enhanced dashboard display
  previewUrl?: string;
  page?: { id?: string; name?: string };
  instagram?: { id?: string; username?: string };
};