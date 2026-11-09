// Audit LGL-02: consentimento de cookies (LGPD art. 7º, I / art. 8º).
// Registro local (localStorage) + cópia best-effort em public.cookie_consents.
// Scripts não essenciais (analytics/marketing) só podem ser carregados via
// loadConsentedScripts(), depois do aceite — nunca direto no index.html.
import { supabase } from '@/integrations/supabase/client';

/** Altere ao mudar categorias/finalidades: força o banner a reaparecer. */
export const COOKIE_POLICY_VERSION = '2026-11-09';

const STORAGE_KEY = 'camply_cookie_consent';
const ANON_ID_KEY = 'camply_cookie_anon_id';
export const OPEN_COOKIE_PREFERENCES_EVENT = 'camply:open-cookie-preferences';

export interface CookieChoices {
  /** Sempre true: sessão/autenticação, segurança, preferências do próprio banner. */
  essential: true;
  /** Métricas de uso (ex.: Google Analytics). */
  analytics: boolean;
  /** Pixels de anúncios/remarketing (ex.: Meta Pixel). */
  marketing: boolean;
}

export interface CookieConsentRecord {
  version: string;
  choices: CookieChoices;
  timestamp: string;
}

/**
 * Scripts não essenciais por categoria. Hoje NÃO há nenhum no projeto
 * (index.html não carrega analytics/pixels). Para adicionar um, registre aqui —
 * ele só será injetado após o consentimento da categoria correspondente.
 */
const CONSENTED_SCRIPTS: Array<{
  id: string;
  category: 'analytics' | 'marketing';
  src: string;
  /** Inicialização opcional após o carregamento. */
  onLoad?: () => void;
}> = [];

export function getStoredConsent(): CookieConsentRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentRecord;
    if (!parsed || parsed.version !== COOKIE_POLICY_VERSION || !parsed.choices) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getAnonId(): string | null {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Grava no banco sem bloquear a UI; falhas são ignoradas (o registro local vale). */
async function persistConsentRemote(record: CookieConsentRecord): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id ?? null;
    await supabase.from('cookie_consents').insert({
      user_id: userId,
      anon_id: getAnonId(),
      consent: { ...record.choices, timestamp: record.timestamp },
      policy_version: record.version,
    });
  } catch {
    // best-effort
  }
}

export function saveConsent(choices: Omit<CookieChoices, 'essential'>): CookieConsentRecord {
  const record: CookieConsentRecord = {
    version: COOKIE_POLICY_VERSION,
    choices: { essential: true, analytics: !!choices.analytics, marketing: !!choices.marketing },
    timestamp: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // localStorage indisponível (modo privado etc.): segue só com o registro remoto
  }
  void persistConsentRemote(record);
  loadConsentedScripts(record.choices);
  return record;
}

const loadedScripts = new Set<string>();

/** Injeta apenas os scripts cujas categorias foram aceitas. Idempotente. */
export function loadConsentedScripts(choices: CookieChoices | null | undefined): void {
  if (!choices || typeof document === 'undefined') return;
  for (const script of CONSENTED_SCRIPTS) {
    if (!choices[script.category] || loadedScripts.has(script.id)) continue;
    loadedScripts.add(script.id);
    const el = document.createElement('script');
    el.id = script.id;
    el.src = script.src;
    el.async = true;
    if (script.onLoad) el.onload = script.onLoad;
    document.head.appendChild(el);
  }
}

/** Reabre o banner de preferências (link "Preferências de cookies" nos rodapés). */
export function openCookiePreferences(): void {
  try {
    window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT));
  } catch {
    // ambiente sem window
  }
}
