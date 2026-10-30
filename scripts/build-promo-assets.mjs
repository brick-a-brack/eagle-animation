// Renders every promo/ store asset to PNG files, headlessly.
//
//   node scripts/build-promo-assets.mjs [--lang en,fr] [--format mobile,tablet] [--out out/promo] [--zip]
//
// It serves the repo with Vite — promo/ for the renderer, docs/screenshots
// for the app captures — opens a bare page that imports the renderer, and saves
// what the canvas produces.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import JSZip from 'jszip';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

// Vite serves the whole repo: the renderer lives in promo/, the app captures it
// draws in docs/screenshots/. Paths, --out included, are relative to the repo root.
const ROOT = resolve(import.meta.dirname, '..');

// The render surface: no UI, just the renderer on window. Vite serves the
// modules, so this page needs no build step and no file of its own.
const RENDER_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>renderer</title><link rel="icon" href="data:,"></head><body>
<script type="module">
  import { FORMAT_KEYS, LANGUAGES, SLIDES } from '/promo/content.js';
  import { waitForFonts } from '/promo/render/fonts.js';
  import { renderSlideToCanvas, slideFileName } from '/promo/render/index.js';
  import { loadScreenshots } from '/promo/render/screenshots.js';

  await loadScreenshots();
  await waitForFonts();

  window.EA = {
    formats: FORMAT_KEYS,
    languages: LANGUAGES,
    slideCount: SLIDES.length,
    fileName: slideFileName,
    renderBase64: (format, index, lang) =>
      renderSlideToCanvas(format, index, lang).toDataURL('image/png').slice('data:image/png;base64,'.length),
  };
  document.body.dataset.ready = 'true';
</script>
</body></html>`;

function parseArgs(argv) {
  const options = { out: 'out/promo', zip: false };
  for (let i = 0; i < argv.length; i += 1) {
    const [flag, inlineValue] = argv[i].split('=');
    const value = () => inlineValue ?? argv[++i];
    if (flag === '--lang') options.langs = value().split(',');
    else if (flag === '--format') options.formats = value().split(',');
    else if (flag === '--out') options.out = value();
    else if (flag === '--zip') options.zip = true;
    else throw new Error(`Unknown option ${flag}`);
  }
  return options;
}

// Serves RENDER_PAGE at /render. configureServer is called before Vite installs
// its own middlewares, so this wins over the single-page fallback.
const renderPagePlugin = () => ({
  name: 'ea-render-page',
  configureServer(server) {
    server.middlewares.use('/render', (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(RENDER_PAGE);
    });
  },
});

// playwright-core ships no browser: use whatever Chromium this machine has.
async function launchBrowser() {
  const attempts = [{}, { channel: 'msedge' }, { channel: 'chrome' }];
  for (const options of attempts) {
    try {
      return await chromium.launch({ headless: true, ...options });
    } catch {
      continue;
    }
  }
  throw new Error('No Chromium found. Run "npx playwright install chromium", or install Chrome or Edge.');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const outDir = resolve(ROOT, options.out);

  const server = await createServer({
    root: ROOT,
    configFile: false,
    // The page imports nothing that needs pre-bundling, and a scan of the repo
    // would choke on the app's path aliases, which live in its own Vite config.
    optimizeDeps: { noDiscovery: true },
    server: { port: 0 },
    logLevel: 'warn',
    plugins: [renderPagePlugin()],
  });
  await server.listen();
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    page.on('console', (msg) => msg.type() === 'error' && console.error(`[page] ${msg.text()}`));
    page.on('pageerror', (error) => console.error(`[page] ${error.message}`));
    await page.goto(`${server.resolvedUrls.local[0]}render`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 60_000 });

    const available = await page.evaluate(() => ({
      formats: window.EA.formats,
      languages: window.EA.languages,
      slideCount: window.EA.slideCount,
    }));
    const langs = options.langs ?? available.languages;
    const formats = options.formats ?? available.formats;
    assertKnown(langs, available.languages, 'language');
    assertKnown(formats, available.formats, 'format');

    await rm(outDir, { recursive: true, force: true });
    let count = 0;

    for (const lang of langs) {
      const zip = options.zip ? new JSZip() : null;
      for (const format of formats) {
        for (let index = 0; index < available.slideCount; index += 1) {
          const { name, base64 } = await page.evaluate(([f, i, l]) => ({ name: window.EA.fileName(f, i, l), base64: window.EA.renderBase64(f, i, l) }), [format, index, lang]);
          const png = Buffer.from(base64, 'base64');
          const relative = join(lang, format, name);
          const file = join(outDir, relative);
          await mkdir(dirname(file), { recursive: true });
          await writeFile(file, png);
          zip?.file(`${format}/${name}`, png);
          count += 1;
          console.log(`  ${relative}`);
        }
      }
      if (zip) {
        const file = join(outDir, `eagle-store-assets-${lang}.zip`);
        await writeFile(file, await zip.generateAsync({ type: 'nodebuffer' }));
        console.log(`  eagle-store-assets-${lang}.zip`);
      }
    }

    console.log(`\n${count} assets written to ${outDir}`);
  } finally {
    await browser.close();
    await server.close();
  }
}

function assertKnown(requested, known, label) {
  const unknown = requested.filter((value) => !known.includes(value));
  if (unknown.length) throw new Error(`Unknown ${label}: ${unknown.join(', ')} (available: ${known.join(', ')})`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
