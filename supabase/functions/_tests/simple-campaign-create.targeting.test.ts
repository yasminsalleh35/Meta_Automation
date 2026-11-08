// audit CMP-05 / CMP-07: geo e agenda do ad set
import { assertEquals, assertThrows } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildGeoLocations, countScheduledDays, normalizeAdSchedule, normalizeAgeRange } from '../simple-campaign-create/targeting.ts';
import { CampaignError } from '../simple-campaign-create/errors.ts';

Deno.test('geo: Meta city key → cities (radius clamped 17–80), state key → regions', () => {
  const geo = buildGeoLocations([
    { name: 'Campinas', type: 'city', key: '263011', radius: 5 },
    { name: 'Minas Gerais', type: 'region', key: '458' },
  ]);
  assertEquals(geo.cities, [{ key: '263011', radius: 17, distance_unit: 'kilometer' }]);
  assertEquals(geo.regions, [{ key: '458' }]);
  assertEquals(geo.custom_locations, undefined);
  assertEquals(geo.countries, undefined);
});

Deno.test('geo: mapbox city with lat/lng → custom_locations; duplicates collapse', () => {
  const sp = { name: 'São Paulo', type: 'city' as const, latitude: -23.55, longitude: -46.63, radius: 120 };
  const geo = buildGeoLocations([sp, { ...sp }]);
  assertEquals(geo.custom_locations, [{ latitude: -23.55, longitude: -46.63, radius: 80, distance_unit: 'kilometer' }]);
});

Deno.test('geo: empty list and 0,0 coordinates are rejected (never a silent country default)', () => {
  const e1 = assertThrows(() => buildGeoLocations([]), CampaignError);
  assertEquals((e1 as CampaignError).code, 'NO_LOCATION');
  const e2 = assertThrows(() => buildGeoLocations([{ name: 'Bahia', type: 'region', latitude: 0, longitude: 0 }]), CampaignError);
  assertEquals((e2 as CampaignError).code, 'NO_LOCATION');
});

Deno.test('schedule: forces ADVERTISER tz, allows end 24:00, drops invalid ranges', () => {
  assertEquals(normalizeAdSchedule([{ start_minute: 540, end_minute: 1440, days: [5, 1, 1], timezone_type: 'USER' }]),
    [{ start_minute: 540, end_minute: 1440, days: [1, 5], timezone_type: 'ADVERTISER' }]);
  assertEquals(normalizeAdSchedule([{ start_minute: 600, end_minute: 600, days: [1] }]), null);
});

Deno.test('countScheduledDays counts only the chosen weekdays, in São Paulo time', () => {
  // seg 06/07 a dom 19/07/2026: 10 dias úteis
  assertEquals(countScheduledDays('2026-07-06T09:00:00-03:00', '2026-07-19T23:59:59-03:00', [1, 2, 3, 4, 5]), 10);
  // 23:30 de domingo em SP já é segunda em UTC — não pode contar a segunda
  assertEquals(countScheduledDays('2026-07-05T23:30:00-03:00', '2026-07-05T23:59:00-03:00', [1]), 1); // mínimo 1
  assertEquals(countScheduledDays('2026-07-05T23:30:00-03:00', '2026-07-05T23:59:00-03:00', [0]), 1);
});

Deno.test('age range: defaults, clamps and orders', () => {
  assertEquals(normalizeAgeRange(undefined, undefined), { age_min: 18, age_max: 65 });
  assertEquals(normalizeAgeRange(13, 99), { age_min: 18, age_max: 65 });
  assertEquals(normalizeAgeRange(25, undefined), { age_min: 25, age_max: 65 });
  assertEquals(normalizeAgeRange(50, 30), { age_min: 30, age_max: 50 });
});
