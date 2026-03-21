import { describe, it, expect } from 'vitest';

// Campaign creation validation logic tests
// These test the same validation rules used by the wizard before submitting

interface CampaignPayload {
  campaignName: string;
  adTitle: string;
  adText: string;
  fanpage: string;
  instagram: string;
  whatsappLink: string;
  dailyBudget: number;
  startDate: string;
  endDate?: string | null;
  city: string;
  radius: number;
  ageMin: number;
  ageMax: number;
  gender: string;
  creativeType: 'upload' | 'post';
  selectedMediaMeta?: { file_type: string; public_url: string; filename: string } | null;
  selectedInstagramPostId?: string | null;
}

function validateCampaignPayload(p: CampaignPayload): string[] {
  const errors: string[] = [];

  if (!p.campaignName || p.campaignName.trim().length < 3) {
    errors.push('Nome da campanha deve ter pelo menos 3 caracteres');
  }
  if (!p.adTitle || p.adTitle.trim().length === 0) {
    errors.push('Título do anúncio é obrigatório');
  }
  if (!p.adText || p.adText.trim().length === 0) {
    errors.push('Texto do anúncio é obrigatório');
  }
  if (!p.fanpage) {
    errors.push('Fanpage é obrigatória');
  }
  if (!p.whatsappLink || !p.whatsappLink.includes('wa.me')) {
    errors.push('Link do WhatsApp inválido');
  }
  if (!p.dailyBudget || p.dailyBudget < 5) {
    errors.push('Orçamento mínimo é R$5,00/dia');
  }
  if (!p.startDate) {
    errors.push('Data de início é obrigatória');
  }
  if (p.endDate && new Date(p.endDate) <= new Date(p.startDate)) {
    errors.push('Data final deve ser posterior à data inicial');
  }
  if (!p.city) {
    errors.push('Cidade é obrigatória');
  }
  if (p.radius < 1 || p.radius > 80) {
    errors.push('Raio deve ser entre 1 e 80 km');
  }
  if (p.ageMin < 18 || p.ageMin > 65) {
    errors.push('Idade mínima deve ser entre 18 e 65');
  }
  if (p.ageMax < p.ageMin) {
    errors.push('Idade máxima deve ser maior que mínima');
  }
  if (p.creativeType === 'upload' && !p.selectedMediaMeta) {
    errors.push('Mídia é obrigatória quando tipo é upload');
  }
  if (p.creativeType === 'post' && !p.selectedInstagramPostId) {
    errors.push('Post do Instagram é obrigatório quando tipo é post');
  }

  return errors;
}

describe('Campaign Payload Validation', () => {
  const validPayload: CampaignPayload = {
    campaignName: 'Campanha Teste',
    adTitle: 'Título do Anúncio',
    adText: 'Texto do anúncio aqui',
    fanpage: '123456789',
    instagram: '987654321',
    whatsappLink: 'https://wa.me/5511999999999',
    dailyBudget: 20,
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    city: 'São Paulo',
    radius: 15,
    ageMin: 25,
    ageMax: 55,
    gender: 'all',
    creativeType: 'upload',
    selectedMediaMeta: {
      file_type: 'image/jpeg',
      public_url: 'https://storage.example.com/image.jpg',
      filename: 'image.jpg',
    },
  };

  it('should pass with valid payload', () => {
    expect(validateCampaignPayload(validPayload)).toEqual([]);
  });

  it('should reject empty campaign name', () => {
    const errors = validateCampaignPayload({ ...validPayload, campaignName: '' });
    expect(errors).toContain('Nome da campanha deve ter pelo menos 3 caracteres');
  });

  it('should reject short campaign name', () => {
    const errors = validateCampaignPayload({ ...validPayload, campaignName: 'ab' });
    expect(errors).toContain('Nome da campanha deve ter pelo menos 3 caracteres');
  });

  it('should reject missing ad title', () => {
    const errors = validateCampaignPayload({ ...validPayload, adTitle: '' });
    expect(errors).toContain('Título do anúncio é obrigatório');
  });

  it('should reject invalid WhatsApp link', () => {
    const errors = validateCampaignPayload({ ...validPayload, whatsappLink: 'https://google.com' });
    expect(errors).toContain('Link do WhatsApp inválido');
  });

  it('should reject budget below minimum', () => {
    const errors = validateCampaignPayload({ ...validPayload, dailyBudget: 3 });
    expect(errors).toContain('Orçamento mínimo é R$5,00/dia');
  });

  it('should reject endDate before startDate', () => {
    const errors = validateCampaignPayload({
      ...validPayload,
      startDate: '2026-04-15',
      endDate: '2026-04-10',
    });
    expect(errors).toContain('Data final deve ser posterior à data inicial');
  });

  it('should reject radius out of bounds', () => {
    const errors = validateCampaignPayload({ ...validPayload, radius: 100 });
    expect(errors).toContain('Raio deve ser entre 1 e 80 km');
  });

  it('should reject age min below 18', () => {
    const errors = validateCampaignPayload({ ...validPayload, ageMin: 15 });
    expect(errors).toContain('Idade mínima deve ser entre 18 e 65');
  });

  it('should reject age max below age min', () => {
    const errors = validateCampaignPayload({ ...validPayload, ageMin: 40, ageMax: 30 });
    expect(errors).toContain('Idade máxima deve ser maior que mínima');
  });

  it('should reject upload type without media', () => {
    const errors = validateCampaignPayload({
      ...validPayload,
      creativeType: 'upload',
      selectedMediaMeta: null,
    });
    expect(errors).toContain('Mídia é obrigatória quando tipo é upload');
  });

  it('should reject post type without post id', () => {
    const errors = validateCampaignPayload({
      ...validPayload,
      creativeType: 'post',
      selectedInstagramPostId: null,
    });
    expect(errors).toContain('Post do Instagram é obrigatório quando tipo é post');
  });

  it('should allow null endDate (open-ended)', () => {
    const errors = validateCampaignPayload({ ...validPayload, endDate: null });
    expect(errors).toEqual([]);
  });

  it('should allow post type with post id', () => {
    const errors = validateCampaignPayload({
      ...validPayload,
      creativeType: 'post',
      selectedInstagramPostId: '17899506438123456',
      selectedMediaMeta: null,
    });
    expect(errors).toEqual([]);
  });
});
