/**
 * Captures all app pages and modals as self-contained HTML files for design review.
 *
 * Usage:
 *   APP_USER=<user> APP_PASS=<pass> node scripts/capture-pages.mjs
 *
 * Requires the dev server running on http://localhost:3000
 *
 * Coverage:
 *  Pages
 *  ✅ 01  Dashboard
 *  ✅ 02  Clients list
 *  ✅ 03  New client — Step 1 Identidad
 *  ✅ 04  New client — Step 2 Restricciones
 *  ✅ 05  New client — Step 3 Plan
 *  ✅ 06  New client — Step 4 Confirmar
 *  ✅ 07  Plans
 *  ✅ 08  Menu import
 *  ✅ 09  Reports
 *  ✅ 10  Users
 *  ✅ 11  Health
 *  Client detail tabs
 *  ✅ 12  Client detail — Resumen
 *  ✅ 13  Client detail — Plan + facturación
 *  ✅ 14  Client detail — Suspensiones
 *  ✅ 15  Client detail — Grupo
 *  ✅ 16  Client detail — Historial
 *  Modals
 *  ✅ 17  Edit client modal
 *  ✅ 18  Renewal modal
 *  ✅ 19  Suspend days modal
 *  ✅ 20  Finalize plan modal
 *  ✅ 21  Delete client modal
 *  ✅ 22  Create plan modal
 *  ✅ 23  Edit plan modal
 *  ✅ 24  Delete plan confirmation modal
 *  ✅ 25  Menu form modal
 *  ✅ 26  User modal
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = join(__dirname, '..', 'design-export');
const USERNAME = process.env.APP_USER;
const PASSWORD = process.env.APP_PASS;

if (!USERNAME || !PASSWORD) {
  console.error('Usage: APP_USER=<user> APP_PASS=<pass> node scripts/capture-pages.mjs');
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

async function inlineStyles(page) {
  await page.evaluate(async () => {
    const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
    for (const link of links) {
      try {
        const res = await fetch(link.href);
        const css = await res.text();
        const style = document.createElement('style');
        style.textContent = css;
        link.replaceWith(style);
      } catch {
        // leave as-is if fetch fails
      }
    }
  });
}

async function save(page, filename) {
  await inlineStyles(page);
  await page.waitForTimeout(400);
  const html = await page.content();
  const outPath = join(OUT_DIR, filename);
  writeFileSync(outPath, html, 'utf8');
  console.log(`  ✅ ${filename}`);
}

async function goto(page, path, waitFor) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() => {});
}

async function clickTab(page, label) {
  await page.locator(`button:has-text("${label}")`).first().click().catch(() => {});
  await page.waitForTimeout(400);
}

async function openModal(page, trigger) {
  await trigger();
  await page.waitForSelector('[role="dialog"], .modal, [data-modal]', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function closeModal(page) {
  // click the backdrop to close (Modal has no Escape handler)
  await page.locator('[aria-hidden="true"].fixed.inset-0').first().click({ force: true }).catch(() => {});
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(200);
}

async function resetClientPage(page, clientId) {
  await goto(page, `/clientes/${clientId}`, '.font-serif');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // ── Login ────────────────────────────────────────────────────────────────
  console.log('Logging in...');
  await goto(page, '/login', '#username');
  await page.fill('#username', USERNAME);
  await page.fill('#password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15000 });
  console.log('Logged in.\n');

  // Grab auth token and first client ID for later use
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  const headers = { Authorization: `Bearer ${token}` };

  let clientId = null;
  try {
    // prefer an active client so all tabs and modals are available
    for (const status of ['active', 'expiring', 'paused']) {
      const res = await page.request.get(`${BASE_URL}/api/clients?limit=1&status=${status}`, { headers });
      const json = await res.json();
      const id = json?.data?.[0]?.id ?? null;
      if (id) { clientId = id; break; }
    }
    if (clientId) console.log(`Using client: ${clientId}\n`);
    else console.warn('No non-ended client found — client detail captures will be skipped\n');
  } catch {
    console.warn('Could not fetch client ID — client detail captures will be skipped\n');
  }

  // ── Pages ────────────────────────────────────────────────────────────────
  console.log('── Pages ──────────────────────────────────────');

  await goto(page, '/', 'h1');
  await save(page, '01-dashboard.html');

  await goto(page, '/clientes', '.font-serif, table');
  await save(page, '02-clients-list.html');

  // New client — all 4 steps
  await goto(page, '/clientes/nuevo', 'form');
  await save(page, '03-new-client-step1-identidad.html');

  // Fill step 1 minimally so we can advance
  await page.fill('input[name="name"]', 'Demo Cliente').catch(() => {});
  await page.locator('select[name="sex"], [name="sex"]').first().selectOption({ index: 1 }).catch(() => {});
  await page.fill('input[name="dateOfBirth"]', '1990-01-15').catch(() => {});
  await page.fill('input[name="phoneNumber"]', '70000000').catch(() => {});
  await page.fill('input[name="address"]', 'Av. Demo 123').catch(() => {});
  await page.locator('[name="deliveryZone"]').first().click().catch(() => {});
  await page.locator('[name="delivery"]').first().click().catch(() => {});
  await page.locator('button:has-text("Siguiente")').click();
  await page.waitForTimeout(400);
  await save(page, '04-new-client-step2-restricciones.html');

  await page.locator('button:has-text("Siguiente")').click();
  await page.waitForTimeout(400);
  await save(page, '05-new-client-step3-plan.html');

  await page.locator('button:has-text("Siguiente")').click().catch(() => {});
  await page.waitForTimeout(400);
  await save(page, '06-new-client-step4-confirmar.html');

  await goto(page, '/planes', '.font-serif');
  await save(page, '07-plans.html');

  await goto(page, '/menu', 'h1');
  await save(page, '08-menu-import.html');

  await goto(page, '/informes', 'h1');
  await save(page, '09-reports.html');

  await goto(page, '/usuarios', 'h1, .font-serif');
  await save(page, '10-users.html');

  await goto(page, '/health', 'h1, .font-serif');
  await save(page, '11-health.html');

  // ── Client detail tabs ───────────────────────────────────────────────────
  if (clientId) {
    console.log('\n── Client detail tabs ─────────────────────────');
    await goto(page, `/clientes/${clientId}`, '.font-serif');

    const tabs = [
      { label: 'Resumen',            file: '12-client-resumen.html' },
      { label: 'Plan + facturación', file: '13-client-plan.html' },
      { label: 'Suspensiones',       file: '14-client-suspensiones.html' },
      { label: 'Grupo',              file: '15-client-grupo.html' },
      { label: 'Historial',          file: '16-client-historial.html' },
    ];

    for (const { label, file } of tabs) {
      await clickTab(page, label);
      await save(page, file);
    }

    // ── Modals on client detail ──────────────────────────────────────────
    console.log('\n── Client detail modals ───────────────────────');

    const openOverflow = async () => {
      await page.locator('button[aria-label="Más acciones"]').first().click();
      await page.waitForTimeout(300);
    };
    const waitDialog = async () => {
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(300);
    };

    const captureModal = async (file, setup) => {
      try {
        await setup();
        await waitDialog();
        await save(page, file);
      } catch (e) {
        console.warn(`  ⚠️  skipped ${file}: ${e.message.split('\n')[0]}`);
      }
    };

    await captureModal('17-modal-edit-client.html', async () => {
      await resetClientPage(page, clientId);
      await openOverflow();
      await page.locator('button:has-text("Editar datos")').first().click();
    });

    await captureModal('18-modal-renewal.html', async () => {
      await resetClientPage(page, clientId);
      await page.locator('button:has-text("Renovar"), button:has-text("Reactivar")').first().click();
    });

    await captureModal('19-modal-suspend.html', async () => {
      await resetClientPage(page, clientId);
      await clickTab(page, 'Suspensiones');
      await page.waitForSelector('button:has-text("Suspender días")', { timeout: 5000 });
      await page.locator('button:has-text("Suspender días")').first().click();
    });

    await captureModal('20-modal-finalize.html', async () => {
      await resetClientPage(page, clientId);
      await openOverflow();
      await page.locator('button:has-text("Finalizar plan")').first().click();
    });

    await captureModal('21-modal-delete-client.html', async () => {
      await resetClientPage(page, clientId);
      await openOverflow();
      await page.locator('button:has-text("Eliminar")').first().click();
    });
  }

  // ── Plan modals ──────────────────────────────────────────────────────────
  console.log('\n── Plan modals ────────────────────────────────');

  const capturePlanModal = async (file, setup) => {
    try {
      await setup();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(300);
      await save(page, file);
    } catch (e) {
      console.warn(`  ⚠️  skipped ${file}: ${e.message.split('\n')[0]}`);
    }
  };

  await capturePlanModal('22-modal-create-plan.html', async () => {
    await goto(page, '/planes', '.font-serif');
    await page.locator('button:has-text("Crear plan")').first().click();
  });

  await capturePlanModal('23-modal-edit-plan.html', async () => {
    await goto(page, '/planes', '.font-serif');
    await page.locator('[role="button"]').first().click();
  });

  // Delete confirmation is inside the still-open edit modal
  try {
    await page.locator('button:has-text("Eliminar")').first().click({ timeout: 5000 });
    await page.waitForTimeout(400);
    await save(page, '24-modal-delete-plan.html');
  } catch (e) {
    console.warn(`  ⚠️  skipped 24-modal-delete-plan.html: ${e.message.split('\n')[0]}`);
  }

  // ── Menu modal ───────────────────────────────────────────────────────────
  console.log('\n── Menu modal ─────────────────────────────────');
  try {
    await goto(page, '/menu', 'h1');
    await page.locator('button:has-text("Cargar menú")').first().click({ timeout: 5000 });
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
    await save(page, '25-modal-menu-form.html');
  } catch (e) {
    console.warn(`  ⚠️  skipped 25-modal-menu-form.html: ${e.message.split('\n')[0]}`);
  }

  // ── User modal (requires admin role) ────────────────────────────────────
  console.log('\n── User modal ─────────────────────────────────');
  try {
    await goto(page, '/usuarios', 'h1, .font-serif, p');
    const hasBtn = await page.locator('button:has-text("Agregar usuario")').count();
    if (hasBtn > 0) {
      await page.locator('button:has-text("Agregar usuario")').first().click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(300);
      await save(page, '26-modal-user.html');
    } else {
      console.warn('  ⚠️  skipped 26-modal-user.html: current user is not admin (re-run with admin credentials)');
    }
  } catch (e) {
    console.warn(`  ⚠️  skipped 26-modal-user.html: ${e.message.split('\n')[0]}`);
  }

  await browser.close();

  const files = (await import('fs')).readdirSync(OUT_DIR).filter((f) => f.endsWith('.html'));
  console.log(`\nDone! ${files.length} files saved to ${OUT_DIR}`);
})();
