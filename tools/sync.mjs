#!/usr/bin/env node
/* ==========================================================================
sync.mjs: keeps the shared header/footer/head blocks identical across every page, and regenerate sitemap.xml.

Use: `node tools/sync.mjs`: rebuild every page includes, rewrite sitemap.xml

Reference partials: anything like this with a corresponding partial file will get replaced each time sync is run

	<!-- @include header: Edit _partials/header.html -->
	...markup...
	<!-- @end header -->
========================================================================== */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PARTIALS_DIR = join(ROOT, '_partials');
const SITE_URL = 'https://revertices.com';

/* Pages excluded from sitemap.xml are still synced */
const NOT_INDEXED = new Set(['404.html']);

const BLOCK =
	/<!--\s*@include\s+([a-z0-9_-]+)\b(?:(?!-->)[\s\S])*?-->([\s\S]*?)<!--\s*@end\s+\1\s*-->/g;

/* --- Load partials -------------------------------------------------------- */
const partials = new Map();

for (const file of readdirSync(PARTIALS_DIR)) {
	if (!file.endsWith('.html')) {
		continue;
	}

	const name = basename(file, '.html');

	partials.set(
		name,
		readFileSync(join(PARTIALS_DIR, file), 'utf8').replace(/\s+$/, '')
	);
}

if (partials.size === 0) {
	console.error('No partials found in _partials/. Nothin\' to do.');

	process.exit(1);
}

/* --- Build each page ------------------------------------------------------ */
const pages = readdirSync(ROOT)
	.filter((f) => f.endsWith('.html'))
	.sort();

let changed = 0;
let warnings = 0;

for (const page of pages) {
	const path = join(ROOT, page);
	const original = readFileSync(path, 'utf8');
	/**
	 * @type string[]
	 */
	const seen = [];

	const updated = original.replace(BLOCK, (match, name) => {
		seen.push(name);

		const body = partials.get(name);

		if (body === undefined) {
			console.warn(`! ${page}: no _partials/${name}.html for @include ${name}. Ignored.`);

			warnings++;

			return match;
		}

		/* Keep the comments; swap only the middle */
		const openEnd = match.indexOf('-->') + 3;
		const open = match.slice(0, openEnd);
		const close = match.slice(match.lastIndexOf('<!--'));

		return `${open}\n${body}\n	${close}`;
	});

	/* Warn an @end with no matching @include, which does nothing */
	for (const m of original.matchAll(/<!--\s*@end\s+([a-z0-9_-]+)\s*-->/g)) {
		if (!seen.includes(m[1])) {
			console.warn(`! ${page}: stray "@end ${m[1]}" with no matching @include`);

			warnings++;
		}
	}

	if (updated !== original) {
		changed++;

		writeFileSync(path, updated);

		console.log(`synced: ${page} (${seen.join(', ') || 'no blocks'})`);
	}
}

/* --- Regenerate sitemap.xml ----------------------------------------------- */
// sitemap is for search engine indexing mainly
const cleanUrl = (/** @type {string} */ page) =>
	page === 'index.html' ? `${SITE_URL}/` : `${SITE_URL}/${basename(page, '.html')}`;

const entries = pages
	.filter((p) => !NOT_INDEXED.has(p))
	.map((p) => {
		const lastmod = statSync(join(ROOT, p))
			.mtime
			.toISOString()
			.slice(0, 10);

		return `  <url>\n    <loc>${cleanUrl(p)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
	});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

const sitemapPath = join(ROOT, 'sitemap.xml');
let sitemapChanged = false;

try {
	sitemapChanged = readFileSync(sitemapPath, 'utf8') !== sitemap;
} catch {
	sitemapChanged = true;
}

if (sitemapChanged) {
	writeFileSync(sitemapPath, sitemap);

	console.log(`wrote: sitemap.xml (${entries.length} urls)`);

	changed++;
}

/* --- Summary -------------------------------------------------------------- */
console.log(
	changed === 0 ?
		`✓ ${pages.length} pages already in sync.` :
		`✓ ${changed} file(s) updated across ${pages.length} pages.`
);

if (warnings > 0) {
	console.log(`(${warnings} warning(s) above)`);
}
