/**
 * Downloads all design systems from designmd.ai and bundles them into
 * packages/autopilot/src/designSystemsData.ts for offline use.
 *
 * Usage: node scripts/download-design-systems.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'packages', 'autopilot', 'src', 'designSystemsData.ts');

const API_BASE = 'https://designmd.ai/api/v1';
const API_KEY = 'dk_df144f5f71d0c078156ab709e5e88ad9f0d467a0';
const PAGE_LIMIT = 20;

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} — ${url}\n${text}`);
  }
  return res;
}

async function fetchAllKits() {
  const kits = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    process.stdout.write(`  Fetching page ${page}/${totalPages}…\r`);
    const res = await apiFetch(`${API_BASE}/kits?limit=${PAGE_LIMIT}&page=${page}`);
    const json = await res.json();
    kits.push(...json.data);
    totalPages = json.pagination.total_pages;
    page++;
  }
  console.log(`\n  Found ${kits.length} kits across ${totalPages} pages.`);
  return kits;
}

async function fetchRawContent(username, slug) {
  const res = await apiFetch(`${API_BASE}/kits/${username}/${slug}/raw`);
  return res.text();
}

function escapeForTemplateLiteral(str) {
  // Escape backticks and ${...} template expressions
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

async function main() {
  console.log('Downloading all design systems from designmd.ai…\n');

  const kits = await fetchAllKits();

  const entries = [];
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < kits.length; i++) {
    const kit = kits[i];
    const { slug, name, author, tags } = kit;
    const username = author?.username ?? 'unknown';

    process.stdout.write(`  [${i + 1}/${kits.length}] ${username}/${slug}…`);
    try {
      const content = await fetchRawContent(username, slug);
      entries.push({ slug, name, author: username, tags: tags ?? [], content });
      process.stdout.write(' ✓\n');
      ok++;
    } catch (err) {
      process.stdout.write(` ✗ ${err.message.split('\n')[0]}\n`);
      fail++;
    }

    // Small delay to be polite to the API
    await new Promise(r => setTimeout(r, 80));
  }

  console.log(`\nDownloaded: ${ok} ✓  Failed: ${fail} ✗`);

  // Build the TypeScript source
  const lines = [
    '// AUTO-GENERATED — do not edit manually.',
    '// Run: node scripts/download-design-systems.mjs',
    `//${' '}Last updated: ${new Date().toISOString()}`,
    `//${' '}Total: ${entries.length} design systems from designmd.ai`,
    '',
    'export interface DesignSystem {',
    '  name: string;',
    '  author: string;',
    '  slug: string;',
    '  tags: string[];',
    '  content: string;',
    '}',
    '',
    'export const designSystems: Record<string, DesignSystem> = {',
  ];

  for (const { slug, name, author, tags, content } of entries) {
    const key = JSON.stringify(slug);
    const safeContent = escapeForTemplateLiteral(content);
    lines.push(`  ${key}: {`);
    lines.push(`    name: ${JSON.stringify(name)},`);
    lines.push(`    author: ${JSON.stringify(author)},`);
    lines.push(`    slug: ${JSON.stringify(slug)},`);
    lines.push(`    tags: ${JSON.stringify(tags)},`);
    lines.push(`    content: \`${safeContent}\`,`);
    lines.push(`  },`);
  }

  lines.push('};');
  lines.push('');
  lines.push('/** Find a design system by slug (exact) or name (case-insensitive substring). */');
  lines.push('export function findDesignSystem(query: string): DesignSystem | undefined {');
  lines.push('  const q = query.trim().toLowerCase();');
  lines.push('  if (designSystems[q]) return designSystems[q];');
  lines.push('  // Fuzzy: match slug containing query or name containing query');
  lines.push('  return Object.values(designSystems).find(');
  lines.push('    (d) => d.slug.includes(q) || d.name.toLowerCase().includes(q),');
  lines.push('  );');
  lines.push('}');
  lines.push('');

  await fs.writeFile(OUT_FILE, lines.join('\n'), 'utf8');

  const bytes = (await fs.stat(OUT_FILE)).size;
  console.log(`\nWrote ${OUT_FILE}`);
  console.log(`File size: ${(bytes / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
