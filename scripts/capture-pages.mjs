/**
 * Captures all app pages as self-contained HTML files for design review.
 *
 * Usage:
 *   USERNAME=admin PASSWORD=secret node scripts/capture-pages.mjs
 *
 * Requires the dev server to be running on http://localhost:3000
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = join(__dirname, '..', 'design-export');
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.error('Usage: USERNAME=<user> PASSWORD=<pass> node scripts/capture-pages.mjs');
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

// Inline all external stylesheets into <style> tags so the file is self-contained
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
        // leave link as-is if fetch fails
      }
    }
  });
}

async function savePage(page, filename) {
  await inlineStyles(page);
  // Give animations a moment to settle
  await page.waitForTimeout(500);
  const html = await page.content();
  const outPath = join(OUT_DIR, filename);
  writeFileSync(outPath, html, 'utf8');
  console.log(`  saved → ${outPath}`);
}

// Navigate and wait for the main content to appear (not just the shell)
async function goto(page, path, waitFor) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() => {});
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
  await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
  console.log('Logged in.\n');

  // ── Pages to capture ────────────────────────────────────────────────────
  const routes = [
    { path: '/',              filename: '01-dashboard.html',        waitFor: 'h1' },
    { path: '/clientes',      filename: '02-clients-list.html',     waitFor: 'table, [data-testid="client-row"], .font-serif' },
    { path: '/clientes/nuevo',filename: '03-new-client.html',       waitFor: 'form, h1' },
    { path: '/planes',        filename: '04-plans.html',            waitFor: '.font-serif, h1' },
    { path: '/menu',          filename: '05-menu-import.html',      waitFor: 'h1' },
    { path: '/informes',      filename: '06-reports.html',          waitFor: 'h1' },
  ];

  // For client detail we grab the first client from the list
  let clientId = null;
  try {
    const res = await page.request.get(`${BASE_URL}/api/clients?limit=1`);
    const json = await res.json();
    clientId = json?.data?.[0]?.id;
  } catch {
    console.warn('Could not fetch a client ID — skipping detail pages');
  }

  if (clientId) {
    const detailTabs = [
      { tab: 'overview',     filename: '07-client-overview.html' },
      { tab: 'plan',         filename: '08-client-plan.html' },
      { tab: 'suspensions',  filename: '09-client-suspensions.html' },
      { tab: 'grupo',        filename: '10-client-group.html' },
      { tab: 'history',      filename: '11-client-history.html' },
    ];

    for (const { tab, filename } of detailTabs) {
      routes.push({
        path: `/clientes/${clientId}#${tab}`,
        filename,
        waitFor: '.font-serif',
        tab,
      });
    }
  }

  // ── Capture ──────────────────────────────────────────────────────────────
  for (const route of routes) {
    console.log(`Capturing ${route.path}...`);
    await goto(page, route.path, route.waitFor);

    // For client detail tabs, click the right tab before saving
    if (route.tab) {
      const tabBtn = page.getByRole('tab', { name: new RegExp(route.tab, 'i') })
        .or(page.locator(`button:has-text("${route.tab}")`))
        .first();
      await tabBtn.click().catch(() => {});
      await page.waitForTimeout(300);
    }

    await savePage(page, route.filename);
  }

  await browser.close();
  console.log(`\nDone! ${routes.length} pages saved to ${OUT_DIR}`);
})();
