#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DEFAULT_BASE_URL = 'http://localhost:4321';
const DEFAULT_OUTPUT_DIR = 'output/smoke-production';
const DEFAULT_ROUTES = ['/', '/en/', '/zh/', '/en/blog/', '/zh/blog/'];

function parseArgs(argv) {
  const options = {
    base: process.env.PUBLIC_SITE_URL || DEFAULT_BASE_URL,
    outdir: DEFAULT_OUTPUT_DIR,
    routes: DEFAULT_ROUTES,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--base') {
      options.base = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--outdir') {
      options.outdir = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--routes') {
      options.routes = argv[index + 1].split(',').map((route) => route.trim()).filter(Boolean);
      index += 1;
      continue;
    }
    throw new Error(`Unsupported argument: ${arg}`);
  }

  if (!options.base) throw new Error('--base requires a URL.');
  if (options.routes.length === 0) throw new Error('--routes must include at least one route.');

  return options;
}

function printHelp() {
  console.log(`
Usage:
  node tools/smoke-production/run.mjs --base http://localhost:4321

Options:
  --base <url>      Site base URL. Defaults to PUBLIC_SITE_URL or ${DEFAULT_BASE_URL}
  --outdir <path>   Output directory. Defaults to ${DEFAULT_OUTPUT_DIR}
  --routes <list>   Comma-separated routes. Defaults to ${DEFAULT_ROUTES.join(',')}
`);
}

async function checkRoute(baseUrl, route) {
  const url = new URL(route.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);

  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'astro-bilingual-knowledge-stack-smoke/0.1',
      },
      redirect: 'follow',
    });
    const body = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const ok = response.ok && contentType.includes('text/html') && /<html[\s>]/i.test(body);

    return {
      route,
      url: url.toString(),
      finalUrl: response.url,
      status: response.status,
      contentType,
      ok,
      error: ok ? null : 'Expected a successful HTML response.',
    };
  } catch (error) {
    return {
      route,
      url: url.toString(),
      finalUrl: '',
      status: 0,
      contentType: '',
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function writeReport(outdir, results) {
  mkdirSync(outdir, { recursive: true });
  writeFileSync(join(outdir, 'smoke-results.json'), `${JSON.stringify(results, null, 2)}\n`);

  const lines = [
    '# Smoke Check Results',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '| Route | Status | Result |',
    '| --- | ---: | --- |',
    ...results.map((result) => `| \`${result.route}\` | ${result.status} | ${result.ok ? 'pass' : `fail: ${result.error}`} |`),
    '',
  ];

  writeFileSync(join(outdir, 'smoke-results.md'), lines.join('\n'));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const outdir = resolve(process.cwd(), options.outdir);
  const results = [];
  for (const route of options.routes) {
    results.push(await checkRoute(options.base, route));
  }

  writeReport(outdir, results);

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    console.error(`Smoke check failed for ${failed.length} route(s).`);
    process.exitCode = 1;
    return;
  }

  console.log(`Smoke check passed for ${results.length} route(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
