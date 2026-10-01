---
name: verify
description: Build, launch and drive the Eagle Animation web app in a headless browser to verify renderer changes end-to-end.
---

# Verifying Eagle Animation changes

Use this to confirm a renderer change actually works in the running app — not just
that it compiles. The **web build** is the fastest surface: it runs the exact same
React renderer as Electron, with no native dependencies to install.

The full loop is: **build → serve in the background → drive with a headless browser →
observe (screenshots + console) → report what you saw.**

## 1. Build & serve

```bash
npm run build:web        # production build → out/web/
npm run start:web:prod   # vite preview on http://localhost:4173 — run in the background
```

Keep the preview server running in the background for the whole session; drive the
browser against `http://localhost:4173`.

## 2. Drive it (headless browser)

Playwright is not a repo dependency. Install `playwright-core` in the scratchpad and
point it at the system Edge — this needs **no browser download**:

```js
const { chromium } = require('playwright-core');

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  // fake camera so the animator's capture flow works without hardware
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});
const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  permissions: ['camera'],
});
const page = await context.newPage();
await page.goto('http://localhost:4173');
```

## 3. Observe & report

- **Take screenshots** at each meaningful step (`page.screenshot(...)`) and actually
  look at them — that is the verification, not the fact that the script ran.
- **Watch the console** for errors: `page.on('console', ...)` and
  `page.on('pageerror', ...)`. A silent white screen is usually a thrown error here.
- Report what you observed against what the change was supposed to do. If it didn't
  work, say so with the evidence (screenshot / console output).

## Gotchas

- **MemoryRouter**: the web app routes in memory, so `page.goto('/settings')` does
  **not** navigate and `page.url()` never changes. Reach every screen by **clicking
  through the UI**.
- **Icon-only buttons** have no accessible name (the title lives in a lazy tooltip).
  Target them via the FontAwesome svg, then walk up to the button:
  `svg[data-icon="gear"]` → `xpath=ancestor::*[@role="button"][1]`. Icon names are the
  `iconName` field in `src/renderer/icons/fa*.js`.
- **Empty projects are hidden**: the Home grid filters out projects with 0 frames, so
  a freshly created project won't appear until it has at least one frame.
- **State lives in IndexedDB, per browser context**: a fresh `newContext()` gives you
  clean first-launch state; reusing a context keeps prior projects/settings.
- **Let it hydrate**: allow ~1s after `goto` for settings and projects to load from
  IndexedDB before asserting on them.
