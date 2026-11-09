#!/usr/bin/env node
// audit QA-06 / PLT-04: bundle budget. Sums the gzipped size of the JS the browser must load
// before first render — the entry <script type="module"> plus every <link rel="modulepreload">
// Vite emits in dist/index.html (i.e. the entry's static import graph). Lazy route chunks are
// excluded. Fails when the total exceeds BUNDLE_BUDGET_KB (default 600; the frontend target is 500).
//
//   npx vite build && node scripts/check-bundle-size.mjs [distDir]
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const dist = path.resolve(process.argv[2] || 'dist');
const budgetKb = Number(process.env.BUNDLE_BUDGET_KB || 600);
const indexHtml = path.join(dist, 'index.html');

if (!existsSync(indexHtml)) {
  console.error(`check-bundle-size: ${indexHtml} not found — run \`npx vite build\` first.`);
  process.exit(2);
}

const html = readFileSync(indexHtml, 'utf8');
const urls = new Set();
for (const m of html.matchAll(/<script\b[^>]*type="module"[^>]*\bsrc="([^"]+)"/g)) urls.add(m[1]);
for (const m of html.matchAll(/<link\b[^>]*rel="modulepreload"[^>]*\bhref="([^"]+)"/g)) urls.add(m[1]);
if (urls.size === 0) {
  console.error('check-bundle-size: no module entry found in index.html');
  process.exit(2);
}

let total = 0;
const rows = [];
for (const url of urls) {
  if (/^https?:\/\//.test(url)) continue; // external CDN scripts are not part of our bundle
  const file = path.join(dist, url.replace(/^\//, '').split('?')[0]);
  const buf = readFileSync(file);
  const gz = gzipSync(buf, { level: 9 }).length;
  total += gz;
  rows.push({ file: path.relative(dist, file), raw: buf.length, gz });
}

rows.sort((a, b) => b.gz - a.gz);
const kb = (n) => (n / 1024).toFixed(1).padStart(8);
console.log('Initial JS (entry + modulepreload):');
for (const r of rows) console.log(`  ${kb(r.gz)} KB gz  ${kb(r.raw)} KB raw  ${r.file}`);
console.log(`  ${'-'.repeat(40)}\n  ${kb(total)} KB gz total — budget ${budgetKb} KB`);

if (total / 1024 > budgetKb) {
  console.error(`\nBundle budget exceeded: ${(total / 1024).toFixed(1)} KB > ${budgetKb} KB (gzip).`);
  process.exit(1);
}
console.log('Bundle budget OK.');
