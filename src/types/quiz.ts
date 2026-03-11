export interface Quiz {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  settings: Record<string, any>;
  thank_you_config: {
    title?: string;
    subtitle?: string;
    showScore?: boolean;
    showEstimates?: boolean;
    ctaText?: string;
    ctaUrl?: string;
  };
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QuizStep {
  id: string;
  quiz_id: string;
  order_index: number;
  type: 'multiple_choice' | 'checkbox' | 'text' | 'number' | 'slider' | 'date' | 'select' | 'info';
  title: string;
  subtitle?: string;
  options: Array<{ value: string; label: string }>;
  field_name: string;
  required: boolean;
  weight: number;
  category?: 'urgency' | 'budget' | 'profile' | 'needs';
  validation?: Record<string, any>;
  conditional?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface QuizLead {
  id: string;
  quiz_id: string;
  responses: Record<string, any>;
  lead_name?: string;
  whatsapp?: string;
  email?: string;
  company_name?: string;
  score?: number;
  score_classification?: 'hot' | 'warm' | 'cold';
  score_details?: {
    score: number;
    classification: string;
    opportunities: string[];
    risks: string[];
    summary: string;
    recommendation: string;
  };
  ai_insights?: {
    opportunities: string[];
    risks: string[];
    summary: string;
    recommendation: string;
  };
  utm_data?: Record<string, any>;
  device?: string;
  referrer?: string;
  status: 'novo' | 'qualificado' | 'contatado' | 'frio' | 'perdido';
  created_at: string;
  updated_at: string;
}

export interface QuizSubmitPayload {
  quiz_id: string;
  responses: Record<string, any>;
  utm_data?: Record<string, any>;
  device?: string;
  referrer?: string;
}

export interface QuizScoringPayload {
  responses: Record<string, any>;
  weights: Record<string, number>;
  quiz_id: string;
}

export interface QuizScoringResponse {
  score: number;
  classification: 'hot' | 'warm' | 'cold';
  opportunities: string[];
  risks: string[];
  summary: string;
  recommendation: string;
}
