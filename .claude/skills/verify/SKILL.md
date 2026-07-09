---
name: verify
description: Build, launch and drive the Eagle Animation web app to verify renderer changes end-to-end.
---

# Verifying Eagle Animation changes

The fastest runtime surface is the **web build** (same React renderer as Electron, no native deps needed).

## Build & serve

```bash
npm run build:web            # production build → out/web/
npm run start:web:prod       # vite preview on http://localhost:4173 (run in background)
```

## Drive it (headless browser)

No Playwright in the repo. Install `playwright-core` in the scratchpad and use the system Edge browser — no browser download needed:

```js
const { chromium } = require('playwright-core');
const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'], // fake camera for the animator
});
const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, permissions: ['camera'] });
```

## Gotchas

- **MemoryRouter**: the web app uses `MemoryRouter`, so `page.goto('/settings')` etc. does NOT work and `page.url()` never changes. Navigate by clicking through the UI only.
- **Icon-only buttons** have no accessible name (title lives in a lazy tooltip). Target them via the FontAwesome svg: `svg[data-icon="gear"]` then `xpath=ancestor::*[@role="button"][1]`. Icon names are in `src/renderer/icons/fa*.js` (`iconName` field).
- Home page filters out projects with 0 frames — a freshly created empty project will not appear on the home grid.
- State persists in IndexedDB per browser context; a fresh `newContext()` = first-launch state.
- Give the app ~2.5s after `goto` for settings/projects to load from IndexedDB.
