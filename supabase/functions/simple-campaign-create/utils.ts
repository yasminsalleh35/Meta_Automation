// ==== [ADD] Interest utils (utils.ts) ========================================

type InterestInput =
  | { id: string; name?: string }
  | { id: number; name?: string }
  | string
  | number;

const INTEREST_ID_RE = /^[0-9]+$/;
const INTERESTS_MAX = 50; // limite defensivo por flex (ajuste fino se necessário)

/** Normaliza, deduplica e limita interesses. Descarta inválidos. */
export function sanitizeInterests(raw: any[]): Array<{id: string, name?: string}> {
  const out: Array<{id: string, name?: string}> = [];
  const seen = new Set<string>();
  for (const it of Array.isArray(raw) ? raw : []) {
    const id = String(it?.id ?? '').trim();
    if (!/^\d{5,}$/.test(id)) continue;      // apenas ids numéricos 5+ dígitos
    if (seen.has(id)) continue;               // dedupe
    seen.add(id);
    // manter name se existir, mas nunca exigir
    out.push(it?.name ? { id, name: String(it.name) } : { id });
  }
  return out;
}

/** Mapeia genders do perfil para o formato esperado (0,1,2). */
export function mapGenders(genders: 'all'|'male'|'female'|number[]|null|undefined): number[] {
  if (Array.isArray(genders) && genders.every(g => g === 0 || g === 1 || g === 2)) return genders;
  if (genders === 'male') return [1];
  if (genders === 'female') return [2];
  return [0]; // 'all' ou indefinido
}

/** Clampa faixa etária para limites compatíveis com Meta. */
export function clampAge(n: number | null | undefined, min: number, max: number): number {
  const v = Number.isFinite(n as number) ? Number(n) : NaN;
  if (Number.isNaN(v)) return min;
  return Math.max(min, Math.min(max, v));
}

// Campaign Profile Types and Utils for Overlay
type CampaignProfile = {
  id: string;
  label: string;
  age_min: number;
  age_max: number;
  genders: 'all' | 'male' | 'female';
  placements_mode: 'automatic' | 'manual';
  placements: string[];
  interests: { id: string; name: string }[];
  version: number;
  is_active: boolean;
  enable_language_targeting?: boolean;
  languages?: string[];
};

export async function getUserCampaignProfile(supabase: any, userId: string): Promise<CampaignProfile | null> {
  const { data: bs } = await supabase
    .from('business_settings')
    .select('campaign_profile_id, category')
    .eq('user_id', userId)
    .maybeSingle();

  // 1st priority: explicitly linked profile
  if (bs?.campaign_profile_id) {
    const { data: profile } = await supabase
      .from('campaign_profiles')
      .select('id,label,age_min,age_max,genders,placements_mode,placements,interests,version,is_active')
      .eq('id', bs.campaign_profile_id)
      .eq('is_active', true)
      .maybeSingle();

    if (profile) return profile;
  }

  // 2nd priority: default active profile for the user's category/sector
  if (bs?.category) {
    const { data: sectorProfile } = await supabase
      .from('campaign_profiles')
      .select('id,label,age_min,age_max,genders,placements_mode,placements,interests,version,is_active')
      .eq('sector', bs.category)
      .eq('is_active', true)
      .eq('is_default', true)
      .maybeSingle();

    if (sectorProfile) {
      console.log('[PROFILE-SECTOR-FALLBACK] Using default sector profile', {
        category: bs.category,
        profileId: sectorProfile.id,
        profileLabel: sectorProfile.label
      });
      return sectorProfile;
    }
  }

  return null;
}

export function applyManualPlacements(targeting: any, aliases: string[]) {
  const publisher = new Set<string>();
  const facebook_positions = new Set<string>();
  const instagram_positions = new Set<string>();

  for (const a of aliases || []) {
    switch (a) {
      case 'facebook_feed':         publisher.add('facebook'); facebook_positions.add('feed'); break;
      case 'facebook_marketplace':  publisher.add('facebook'); facebook_positions.add('marketplace'); break;
      case 'facebook_video_feeds':  publisher.add('facebook'); facebook_positions.add('video_feeds'); break;
      case 'facebook_right_column': publisher.add('facebook'); facebook_positions.add('right_hand_column'); break;
      case 'instagram_feed':        publisher.add('instagram'); instagram_positions.add('stream'); break;
      case 'instagram_stories':     publisher.add('instagram'); instagram_positions.add('story'); break;
      case 'instagram_reels':       publisher.add('instagram'); instagram_positions.add('reels'); break;
      case 'instagram_explore':     publisher.add('instagram'); instagram_positions.add('explore'); break;
      default: break;
    }
  }

  if (publisher.size)           targeting.publisher_platforms = Array.from(publisher);
  if (facebook_positions.size)  targeting.facebook_positions = Array.from(facebook_positions);
  if (instagram_positions.size) targeting.instagram_positions = Array.from(instagram_positions);

  if (!targeting.device_platforms) targeting.device_platforms = ['mobile'];
}

// ==== [PATCH] applyProfileOverlayOnTargeting (utils.ts) ======================

export function applyProfileOverlayOnTargeting(
  targeting: any,
  profile: any
) {
  const before = JSON.parse(JSON.stringify(targeting)); // para log comparativo no caller

  // ages
  const ageMin = clampAge(profile?.age_min, 13, 65);
  const ageMax = clampAge(profile?.age_max, 13, 65);
  if (ageMin) targeting.age_min = ageMin;
  if (ageMax) targeting.age_max = ageMax;

  // genders
  if (profile?.genders != null) {
    targeting.genders = mapGenders(profile.genders);
  }

  // placements
  if (profile?.placements_mode === 'manual' && Array.isArray(profile?.placements)) {
    // mapeamento existente de aliases -> positions (reaproveite sua lógica já implementada)
    // Garanta publisher_platforms/positions coerentes. Exemplo:
    targeting.publisher_platforms = Array.from(new Set([
      ...(targeting.publisher_platforms || []),
      'facebook', 'instagram'
    ]));
    // Opcional: reduzir positions conforme profile. Reaproveite funções já existentes no arquivo.
    applyManualPlacements(targeting, profile.placements);
  }

  // interests → flexible_spec
  const normalized = sanitizeInterests(profile?.interests);
  
  // Log interests sanitization
  console.log('[INTERESTS-SANITIZED] Interests sanitized', {
    inputCount: profile?.interests?.length || 0,
    outputCount: normalized.length,
    sampleIds: normalized.slice(0, 5).map(i => i.id)
  });

  if (normalized.length > 0) {
    const baseFlex = Array.isArray(targeting.flexible_spec) ? targeting.flexible_spec.slice() : [];
    // substitui quaisquer interests anteriores por um bloco único normalizado
    baseFlex.push({ interests: normalized });
    targeting.flexible_spec = baseFlex;
  } else {
    // evita mandar flexible_spec vazio/nulo malformado
    if ('flexible_spec' in targeting && (!Array.isArray(targeting.flexible_spec) || targeting.flexible_spec.length === 0)) {
      delete targeting.flexible_spec;
    }
  }

  // languages (language targeting)
  if (profile?.enable_language_targeting && Array.isArray(profile?.languages) && profile.languages.length > 0) {
    // Validar formato ISO (ll_CC)
    const validLanguages = profile.languages.filter((lang: string) => {
      const isValid = typeof lang === 'string' && /^[a-z]{2}_[A-Z]{2}$/.test(lang);
      if (!isValid) {
        console.warn('[LANGUAGE-INVALID] Código de idioma inválido ignorado:', lang);
      }
      return isValid;
    });

    if (validLanguages.length > 0) {
      targeting.languages = validLanguages;
      console.log('[LANGUAGE-APPLIED] Languages aplicados ao targeting:', {
        count: validLanguages.length,
        codes: validLanguages
      });
    }
  } else {
    // Se não tem language targeting, não adicionar o campo (comportamento padrão do Meta)
    if ('languages' in targeting) {
      delete targeting.languages;
    }
  }

  return targeting;
}