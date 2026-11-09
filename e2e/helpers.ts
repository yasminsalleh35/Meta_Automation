import { expect, type ConsoleMessage, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Console noise that is not an app error (browser/extension/third-party). */
const IGNORED_CONSOLE = [
  /ResizeObserver loop/i,
  /favicon\.ico/i,
  /Download the React DevTools/i,
];

/** Collects console errors + uncaught page errors for the lifetime of the page. */
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
    errors.push(`[console] ${text.slice(0, 300)}`);
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${String(err.message).slice(0, 300)}`));
  return {
    errors,
    reset: () => { errors.length = 0; },
  };
}

/** Waits until the SPA rendered something into #root (beyond the lazy-route loader). */
export async function waitForApp(page: Page, timeout = 20_000) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return !!root && root.innerText.trim().length > 0;
  }, undefined, { timeout }).catch(() => { /* reported by isBlank */ });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => { /* long-polling is fine */ });
}

export async function isBlank(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const root = document.getElementById('root');
    return !root || root.innerText.trim().length === 0;
  });
}

export async function isNotFound(page: Page): Promise<boolean> {
  return (await page.getByText('Oops! Page not found').count()) > 0;
}

/** Accepts the cookie banner if present so it doesn't cover the UI. */
export async function dismissCookieBanner(page: Page) {
  const btn = page.getByRole('button', { name: 'Apenas essenciais' });
  if (await btn.isVisible().catch(() => false)) await btn.click();
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await waitForApp(page);
  await dismissCookieBanner(page);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 30_000 });
  await waitForApp(page);
}

export async function logout(page: Page) {
  // Avatar dropdown in DashboardHeader / MobileHeader → "Sair"/"Logout" menu item.
  const trigger = page.locator('header button[aria-haspopup="menu"]').last();
  await trigger.click();
  await page.getByRole('menuitem', { name: /sair|logout|log out/i }).click();
  await page.waitForURL((url) => url.pathname === '/' || url.pathname.startsWith('/auth'), { timeout: 20_000 });
  await expect(page.locator('#root')).not.toBeEmpty();
}

// ---------------------------------------------------------------------------------------------
// Route collection from the router source (src/App.tsx + src/routes/PrivateRoutes.tsx)
// ---------------------------------------------------------------------------------------------
export interface AppRoute {
  path: string;
  kind: 'public' | 'private' | 'admin';
  redirect: boolean;
  hasParams: boolean;
}

function joinPath(parent: string, child: string): string {
  if (child.startsWith('/')) return child;
  const base = parent.replace(/\/?\*$/, '').replace(/\/$/, '');
  return `${base}/${child}`;
}

/** Tiny JSX scanner: tracks <Route> nesting and resolves child paths against their parent. */
function scanRoutes(source: string, rootPrefix: string): Array<{ path: string; redirect: boolean }> {
  const out: Array<{ path: string; redirect: boolean }> = [];
  const stack: string[] = [rootPrefix];
  const re = /<Route\b|<\/Route>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    if (m[0] === '</Route>') { stack.pop(); continue; }
    // Find the end of the opening tag: the first `>` outside `{…}` (element={<X>…</X>} nests JSX).
    let i = m.index + m[0].length;
    let depth = 0;
    for (; i < source.length; i++) {
      const ch = source[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) break;
    }
    const selfClosing = source[i - 1] === '/';
    const attrs = source.slice(m.index + m[0].length, selfClosing ? i - 1 : i);
    re.lastIndex = i + 1;
    const pathAttr = attrs.match(/\bpath="([^"]*)"/)?.[1];
    const isIndex = /\bindex\b/.test(attrs) && !pathAttr;
    const parent = stack[stack.length - 1];
    const full = pathAttr !== undefined ? joinPath(parent, pathAttr) : parent;
    if (pathAttr !== undefined || isIndex) {
      out.push({ path: full.replace(/\/+/g, '/') || '/', redirect: /<Navigate\b/.test(attrs) });
    }
    if (!selfClosing) stack.push(pathAttr !== undefined ? full : parent);
  }
  return out;
}

export function collectRoutes(): AppRoute[] {
  const app = readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');
  const priv = readFileSync(path.join(ROOT, 'src/routes/PrivateRoutes.tsx'), 'utf8');
  const all = [
    ...scanRoutes(app, '').map((r) => ({ ...r, private: false })),
    ...scanRoutes(priv, '').map((r) => ({ ...r, private: true })),
  ];
  const seen = new Set<string>();
  const routes: AppRoute[] = [];
  for (const r of all) {
    if (r.path.includes('*')) continue; // catch-alls / layout parents
    const key = `${r.private}:${r.path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    routes.push({
      path: r.path,
      kind: !r.private ? 'public' : r.path.startsWith('/admin') ? 'admin' : 'private',
      redirect: r.redirect,
      hasParams: r.path.includes(':'),
    });
  }
  return routes;
}

/** Fills known route params; returns null when the route can't be visited meaningfully. */
export function materialize(route: AppRoute): string | null {
  if (!route.hasParams) return route.path;
  if (route.path === '/quizz/:slug') return `/quizz/${process.env.E2E_QUIZ_SLUG || 'diagnostico-anuncios'}`;
  return null;
}
