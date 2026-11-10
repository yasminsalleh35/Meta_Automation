// audit QA-05: route crawler. Routes come from the router source (src/App.tsx +
// src/routes/PrivateRoutes.tsx). Each route is visited as anon (always), as a user (E2E_EMAIL /
// E2E_PASSWORD) and as an admin (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD). A route fails when it
// renders a blank #root, the NotFound page, or logs console/page errors.
import { test, expect, type Page } from '@playwright/test';
import { collectErrors, collectRoutes, dismissCookieBanner, isBlank, isNotFound, login, materialize, waitForApp, type AppRoute } from './helpers';

const routes = collectRoutes();

/**
 * Console errors that are the intended behaviour of a route when visited directly (not a bug).
 * The Meta OAuth callbacks only work inside the popup opened by the app; opened directly they
 * log an error and close/redirect. (Consider downgrading those to console.warn.)
 */
const EXPECTED_CONSOLE: Record<string, RegExp> = {
  '/auth/meta-callback': /MetaCallback: not opened by the app or missing state/,
  // audit SEC-14: the old route now renders the same state-checked MetaCallback page
  '/auth/callback/meta': /MetaCallback: not opened by the app or missing state/,
};

const log = (line: string) => process.stdout.write(`${line}
`);

interface Result { url: string; finalPath: string; problems: string[] }

async function visit(page: Page, url: string, errors: string[]): Promise<Result> {
  errors.length = 0;
  const problems: string[] = [];
  const res = await page.goto(url).catch((e) => { problems.push(`navigation: ${e.message}`); return null; });
  if (res && res.status() >= 400) problems.push(`HTTP ${res.status()}`);
  await waitForApp(page);
  await dismissCookieBanner(page);
  if (await isBlank(page)) problems.push('blank #root');
  if (await isNotFound(page)) problems.push('NotFound page on a defined route');
  const expected = EXPECTED_CONSOLE[url];
  problems.push(...errors.filter((e) => !(expected && expected.test(e))));
  return { url, finalPath: new URL(page.url()).pathname, problems };
}

function report(label: string, results: Result[]) {
  const failed = results.filter((r) => r.problems.length);
  log(`\n[crawl:${label}] ${results.length} routes, ${failed.length} with problems`);
  for (const r of results) {
    const mark = r.problems.length ? 'FAIL' : 'ok  ';
    log(`  ${mark} ${r.url}${r.finalPath !== r.url ? ` -> ${r.finalPath}` : ''}${r.problems.length ? `\n         ${r.problems.join('\n         ')}` : ''}`);
  }
  return failed;
}

function targets(kinds: AppRoute['kind'][]) {
  const list: string[] = [];
  const skipped: string[] = [];
  for (const r of routes.filter((x) => kinds.includes(x.kind))) {
    const url = materialize(r);
    if (url) list.push(url); else skipped.push(r.path);
  }
  return { list: [...new Set(list)], skipped };
}

test('router source yields routes', () => {
  expect(routes.length).toBeGreaterThan(30);
  expect(routes.some((r) => r.path === '/auth/login')).toBe(true);
  expect(routes.some((r) => r.path === '/dashboard/settings')).toBe(true);
});

test('crawl as anon: public routes render, private routes redirect to login', async ({ page }) => {
  const { errors } = collectErrors(page);
  const pub = targets(['public']);
  const priv = targets(['private', 'admin']);
  const results: Result[] = [];
  for (const url of pub.list) results.push(await visit(page, url, errors));
  for (const url of priv.list) {
    const r = await visit(page, url, errors);
    // anon must never see a private page: expect the login screen (or the landing page)
    if (!(r.finalPath.startsWith('/auth/') || r.finalPath === '/')) r.problems.push(`private route rendered for anon (ended at ${r.finalPath})`);
    results.push(r);
  }
  log(`[crawl:anon] skipped (need ids): ${[...pub.skipped, ...priv.skipped].join(', ') || '-'}`);
  const failed = report('anon', results);
  expect(failed.map((f) => `${f.url}: ${f.problems.join(' | ')}`)).toEqual([]);
});

test('crawl as user', async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  test.skip(!email || !password, 'E2E_EMAIL / E2E_PASSWORD not set');
  const { errors } = collectErrors(page);
  await login(page, email!, password!);
  const priv = targets(['private']);
  const results: Result[] = [];
  for (const url of priv.list) results.push(await visit(page, url, errors));
  // a regular user must be bounced away from /admin
  for (const url of targets(['admin']).list.slice(0, 3)) {
    const r = await visit(page, url, errors);
    if (r.finalPath.startsWith('/admin')) r.problems.push('regular user stayed on an admin route');
    results.push(r);
  }
  const failed = report('user', results);
  expect(failed.map((f) => `${f.url}: ${f.problems.join(' | ')}`)).toEqual([]);
});

test('crawl as admin', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set');
  const { errors } = collectErrors(page);
  await login(page, email!, password!);
  const results: Result[] = [];
  for (const url of targets(['admin']).list) results.push(await visit(page, url, errors));
  const failed = report('admin', results);
  expect(failed.map((f) => `${f.url}: ${f.problems.join(' | ')}`)).toEqual([]);
});
