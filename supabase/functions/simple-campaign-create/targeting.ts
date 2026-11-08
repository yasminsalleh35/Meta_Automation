// Montagem de geo e agenda do ad set (audit CMP-05 / CMP-07). Funções puras, testadas em _tests.
import { CampaignError } from './errors.ts';

export interface SelectedLocation {
  key?: string;
  name: string;
  type: 'city' | 'region' | 'country';
  country_code?: string;
  radius?: number;
  latitude?: number;
  longitude?: number;
}

// Limites da Meta para raio (km): cidades por key 17–80; custom_locations 1–80.
const CITY_RADIUS = { min: 17, max: 80 };
const CUSTOM_RADIUS = { min: 1, max: 80 };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const validCoords = (lat?: number, lng?: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  !(lat === 0 && lng === 0) &&
  Math.abs(lat as number) <= 90 && Math.abs(lng as number) <= 180;

/**
 * selected_locations → geo_locations. Sem localização = 422 NO_LOCATION (nunca um padrão silencioso
 * como "Brasil inteiro"). Cidade com key → cities; estado com key → regions; país → countries;
 * só entradas com lat/lng reais vão para custom_locations.
 */
export function buildGeoLocations(
  locations: SelectedLocation[] | null | undefined,
  defaultRadiusKm = 10,
): Record<string, unknown> {
  const locs = Array.isArray(locations) ? locations : [];
  if (locs.length === 0) {
    throw new CampaignError('NO_LOCATION', 'Escolha pelo menos uma cidade ou estado para a campanha.');
  }

  const cities: unknown[] = [];
  const regions: unknown[] = [];
  const custom: unknown[] = [];
  const countries = new Set<string>();
  const seen = new Set<string>();

  for (const loc of locs) {
    const dedupe = loc.key ? `k:${loc.type}:${loc.key}` : `c:${loc.latitude},${loc.longitude}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);

    const radius = Number(loc.radius ?? (loc.type === 'region' ? CUSTOM_RADIUS.max : defaultRadiusKm)) || defaultRadiusKm;

    if (loc.type === 'country' && (loc.key || loc.country_code)) {
      countries.add(String(loc.key || loc.country_code).toUpperCase());
    } else if (loc.type === 'region' && loc.key) {
      regions.push({ key: String(loc.key) });
    } else if (loc.type === 'city' && loc.key) {
      cities.push({ key: String(loc.key), radius: clamp(radius, CITY_RADIUS.min, CITY_RADIUS.max), distance_unit: 'kilometer' });
    } else if (validCoords(loc.latitude, loc.longitude)) {
      custom.push({
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius: clamp(radius, CUSTOM_RADIUS.min, CUSTOM_RADIUS.max),
        distance_unit: 'kilometer',
      });
    } else {
      throw new CampaignError('NO_LOCATION',
        `Não conseguimos localizar "${loc.name}". Remova e escolha a localização novamente.`);
    }
  }

  const geo: Record<string, unknown> = { location_types: ['home', 'recent'] };
  if (cities.length) geo.cities = cities;
  if (regions.length) geo.regions = regions;
  if (custom.length) geo.custom_locations = custom;
  if (countries.size) geo.countries = [...countries];
  return geo;
}

export interface AdScheduleEntry {
  start_minute: number;
  end_minute: number;
  days: number[];
  timezone_type?: string;
}

/** Agenda válida para a Meta: minutos 0–1440, início < fim, dias 0–6, fuso da conta de anúncios. */
export function normalizeAdSchedule(schedule: AdScheduleEntry[] | null | undefined): AdScheduleEntry[] | null {
  if (!Array.isArray(schedule) || schedule.length === 0) return null;
  const out = schedule
    .map((s) => ({
      start_minute: clamp(Math.round(Number(s.start_minute)), 0, 1440),
      end_minute: clamp(Math.round(Number(s.end_minute)), 0, 1440),
      days: [...new Set((s.days || []).map(Number).filter((d) => d >= 0 && d <= 6))].sort(),
      // a UI promete "fuso horário da conta de anúncios"
      timezone_type: 'ADVERTISER',
    }))
    .filter((s) => s.start_minute < s.end_minute && s.days.length > 0);
  return out.length ? out : null;
}

// Brasil sem horário de verão desde 2019: America/Sao_Paulo = UTC-3 fixo.
const SAO_PAULO_OFFSET_MS = -3 * 60 * 60 * 1000;

/** Quantos dias do período [start, end] caem nos dias da semana agendados (fuso de São Paulo). */
export function countScheduledDays(startIso: string, endIso: string, days: number[]): number {
  const wanted = new Set(days);
  const start = new Date(new Date(startIso).getTime() + SAO_PAULO_OFFSET_MS);
  const end = new Date(new Date(endIso).getTime() + SAO_PAULO_OFFSET_MS);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return 1;
  const day = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  let count = 0;
  for (let i = 0; day.getTime() <= last && i < 3660; i++) {
    if (wanted.has(day.getUTCDay())) count++;
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return Math.max(1, count);
}

/** Idade dentro de 18–65 com padrão quando ausente; garante min ≤ max (audit CMP-07). */
export function normalizeAgeRange(min?: number | null, max?: number | null): { age_min: number; age_max: number } {
  const lo = Number.isFinite(min as number) ? clamp(Number(min), 18, 65) : 18;
  const hi = Number.isFinite(max as number) ? clamp(Number(max), 18, 65) : 65;
  return lo <= hi ? { age_min: lo, age_max: hi } : { age_min: hi, age_max: lo };
}
