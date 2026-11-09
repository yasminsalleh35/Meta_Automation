// audit QA-04 (reduced: no staging). Smoke against BASE_URL (default: production).
// Never uses real customer accounts; login steps need E2E_EMAIL / E2E_PASSWORD of a TEST user.
import { test, expect } from '@playwright/test';
import { collectErrors, dismissCookieBanner, isBlank, isNotFound, login, logout, waitForApp } from './helpers';

const ANON_PAGES = ['/', '/auth/login', '/legal/privacy', '/legal/terms', '/quiz'];

test.describe('anon pages', () => {
  for (const url of ANON_PAGES) {
    test(`${url} loads without console errors`, async ({ page }) => {
      const { errors } = collectErrors(page);
      const res = await page.goto(url);
      expect(res?.status(), 'HTTP status').toBeLessThan(400);
      await waitForApp(page);
      expect(await isBlank(page), 'blank #root').toBe(false);
      expect(await isNotFound(page), 'NotFound rendered').toBe(false);
      expect(errors, errors.join('\n')).toEqual([]);
    });
  }
});

test.describe('cookie consent (LGL-02)', () => {
  test('banner appears for a new visitor and the choice is stored', async ({ page }) => {
    await page.goto('/legal/privacy');
    await waitForApp(page);
    const banner = page.getByRole('dialog', { name: 'Aviso de cookies' });
    await expect(banner).toBeVisible();
    await banner.getByRole('button', { name: 'Apenas essenciais' }).click();
    await expect(banner).toBeHidden();
    const stored = await page.evaluate(() => localStorage.getItem('camply_cookie_consent'));
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.choices).toMatchObject({ essential: true, analytics: false, marketing: false });
    // persists across reloads
    await page.reload();
    await waitForApp(page);
    await expect(page.getByRole('dialog', { name: 'Aviso de cookies' })).toHaveCount(0);
  });
});

test.describe('authenticated smoke', () => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  test.skip(!email || !password, 'E2E_EMAIL / E2E_PASSWORD not set');

  test('login → dashboard → campaign wizard → settings privacy → logout', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page, email!, password!);

    await page.goto('/dashboard');
    await waitForApp(page);
    await dismissCookieBanner(page);
    expect(await isBlank(page)).toBe(false);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/dashboard/simple-campaign-wizard');
    await waitForApp(page);
    expect(await isNotFound(page)).toBe(false);
    // Step 1 of the wizard asks for the campaign name
    await expect(page.locator('input').first()).toBeVisible();

    await page.goto('/dashboard/settings');
    await waitForApp(page);
    const privacyTab = page.getByRole('tab', { name: 'Privacidade' });
    await expect(privacyTab).toBeVisible();
    await privacyTab.click();
    await expect(page.getByRole('tabpanel')).toBeVisible();

    await logout(page);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test.skip('Asaas monthly purchase in sandbox → account → login', async () => {
    // Needs a staging site wired to the Asaas SANDBOX (never production payments).
    // Steps: /plano-mensal → checkout (sandbox card) → asaas-webhook → account e-mail → set password → login.
  });

  test.skip('connect Meta (test app) → create CTWA campaign → list → activate → pause', async () => {
    // Needs a Meta TEST app + test ad account/page bound to the E2E user (never a real ad account).
  });

  test.skip('cancel subscription → paywall; logout → login as another user → no leaked assets', async () => {
    // Needs the sandbox subscription from the purchase test and a second E2E user (E2E_EMAIL_B).
  });
});
