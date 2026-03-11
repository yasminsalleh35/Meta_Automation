import { SpecialtyInput, StrategyPayload, StrategyResult } from '@/types/strategy.types';

export const SPECIALTIES: SpecialtyInput[] = [
  { key: 'invisalign', label: 'Invisalign', weight: 3, defaultAge: [25, 54] },
  { key: 'lentes', label: 'Lentes de Contato Dental', weight: 3, defaultAge: [23, 54] },
  { key: 'facetas', label: 'Facetas de Porcelana', weight: 3, defaultAge: [25, 54] },
  { key: 'harmonizacao', label: 'Harmonização Orofacial', weight: 3, defaultAge: [25, 50] },
  { key: 'implantes_premium', label: 'Implantes Premium', weight: 3, defaultAge: [35, 65] },
  { key: 'implantes', label: 'Implantes', weight: 2, defaultAge: [35, 65] },
  { key: 'clareamento', label: 'Clareamento', weight: 2, defaultAge: [20, 55] },
  { key: 'aparelho_estetico', label: 'Ortodontia (aparelho estético)', weight: 2, defaultAge: [18, 44] },
  { key: 'reabilitacao', label: 'Reabilitação Oral', weight: 2, defaultAge: [30, 65] },
  { key: 'ortodontia', label: 'Ortodontia (aparelho metálico)', weight: 1, defaultAge: [18, 44] },
  { key: 'endodontia', label: 'Endodontia (canal)', weight: 1, defaultAge: [25, 55] },
  { key: 'periodontia', label: 'Periodontia', weight: 1, defaultAge: [25, 60] },
  { key: 'protese', label: 'Prótese', weight: 1, defaultAge: [30, 65] },
  { key: 'dentistica', label: 'Dentística Restauradora', weight: 1, defaultAge: [20, 55] },
  { key: 'cirurgia', label: 'Cirurgia Oral', weight: 1, defaultAge: [20, 60] },
  { key: 'bruxismo', label: 'Bruxismo/Placa', weight: 1, defaultAge: [20, 55] },
  { key: 'radiologia', label: 'Radiologia Odontológica', weight: 1, defaultAge: [25, 60] },
  { key: 'odonto_pediatria', label: 'Odontopediatria', weight: 1, defaultAge: [25, 45] },
  { key: 'gestantes', label: 'Odonto para Gestantes', weight: 1, defaultAge: [25, 40] },
  { key: 'idosos', label: 'Odonto para Idosos', weight: 1, defaultAge: [45, 70] },
];

const PREMIUM_NEIGHBORHOODS = [
  'Morada do Vale',
  'Ilha',
  'Lagoa Santa',
  'Grã Duquesa',
  'Retiro dos Lagos',
  'Jardim das Flores',
  'Belvedere',
  'Alphaville',
  'Santo Agostinho',
  'Centro',
];

export function buildStrategy(payload: StrategyPayload): StrategyResult {
  // Encontrar especialidades selecionadas e calcular média ponderada
  const items = payload.specialties
    .map((s) => ({ s, spec: SPECIALTIES.find((sp) => sp.key === s.key) }))
    .filter((it) => !!it.spec) as { s: { key: string; ticket?: number }; spec: SpecialtyInput }[];

  const weights = items.map((it) => it.spec.weight);
  const weightAvg = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 1;

  // Inferir classe econômica baseada na média ponderada
  const economicClass: StrategyResult['economicClass'] =
    weightAvg >= 2.4 ? 'A' : weightAvg >= 1.6 ? 'A/B' : 'B/C';

  // Combinar faixas etárias das especialidades selecionadas
  const minDefault = items.length > 0 ? Math.min(...items.map((it) => it.spec.defaultAge?.[0] ?? 18)) : 18;
  const maxDefault = items.length > 0 ? Math.max(...items.map((it) => it.spec.defaultAge?.[1] ?? 65)) : 65;
  const ageMin = payload.ageMin ?? minDefault;
  const ageMax = payload.ageMax ?? maxDefault;

  // Calcular orçamento baseado no ticket médio ponderado
  const avgTicket =
    items.length === 0
      ? 400
      : items.reduce((sum, it) => sum + (it.s.ticket ?? 400), 0) / items.length;

  const rawBudget = Math.max(avgTicket / 20, 30);
  const dailyBudgetBRL = Math.min(Math.round(rawBudget), 100);

  // Gerar interesses baseados nas especialidades
  const interests = new Set<string>([
    'Odontologia',
    'Tratamento dentário',
    'Sorriso',
    'Clareamento dental',
    'Aparelho ortodôntico',
    'Implantes dentários',
    'Cuidados pessoais',
    'Estética',
    'Saúde e bem-estar',
  ]);

  items.forEach(({ spec }) => {
    if (['invisalign', 'lentes', 'facetas', 'harmonizacao'].includes(spec.key)) {
      interests.add('Alinhadores transparentes');
      interests.add('Estética dental');
      interests.add('Harmonização orofacial');
    }
    if (spec.key.includes('implantes')) interests.add('Reabilitação oral');
    if (spec.key.includes('ortodontia') || spec.key === 'aparelho_estetico') {
      interests.add('Ortodontia');
    }
  });

  const neighborhoods = economicClass === 'A' ? PREMIUM_NEIGHBORHOODS : undefined;

  return {
    economicClass,
    ageRange: [ageMin, ageMax],
    neighborhoods,
    interests: Array.from(interests),
    dailyBudgetBRL,
    rationale: {
      class: 'Classificação baseada na complexidade/valor das especialidades selecionadas.',
      location: neighborhoods
        ? 'Público com maior poder aquisitivo: priorizamos bairros com maior índice econômico.'
        : 'Como o público é mais amplo, a segmentação por localização será mais abrangente (cidade e raio).',
      interests: 'Interesses ligados a tratamentos e cuidados odontológicos para refinar a entrega.',
      budget: `Orçamento calculado a partir do ticket médio informado (piso R$30/dia, teto R$100/dia).`,
    },
    creativeSamples: [
      {
        title: `Sorriso alinhado com ${payload.businessName || 'sua clínica'}!`,
        text: `Tratamentos modernos e confortáveis. Agende uma avaliação e descubra o que é possível para o seu sorriso.`,
      },
      {
        title: `Implantes com naturalidade e segurança`,
        text: `Equipe experiente e tecnologia de ponta. Clique e fale no WhatsApp para saber valores e condições.`,
      },
    ],
  };
}