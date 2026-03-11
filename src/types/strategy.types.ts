export type EconomicClass = 'A' | 'A/B' | 'B/C';

export interface SpecialtyInput {
  key: string;
  label: string;
  weight: 1 | 2 | 3;
  defaultAge?: [number, number];
}

export interface SpecialtyTicket {
  key: string;
  ticket?: number;
}

export interface StrategyPayload {
  specialties: SpecialtyTicket[];
  ageMin?: number;
  ageMax?: number;
  city?: string;
  businessName?: string;
}

export interface StrategyResult {
  economicClass: EconomicClass;
  ageRange: [number, number];
  neighborhoods?: string[];
  interests: string[];
  dailyBudgetBRL: number;
  rationale: {
    class: string;
    location: string;
    interests: string;
    budget: string;
  };
  creativeSamples: { title: string; text: string }[];
}

export interface StrategyReport {
  id: string;
  user_id: string;
  source: string;
  title: string;
  payload: StrategyPayload;
  result: StrategyResult;
  snapshot_html?: string;
  created_at: string;
}