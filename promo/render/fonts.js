// The same self-hosted Open Sans the app uses (see src/renderer/styles/global.css):
// no CDN, so a headless build renders identical text with no network.
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/open-sans/800.css';

const WEIGHTS = [400, 600, 700, 800];

// Canvas measures text with the fallback font until the real faces are ready.
export async function waitForFonts() {
  if (!document.fonts) return;
  await Promise.all(WEIGHTS.map((w) => document.fonts.load(`${w} 40px 'Open Sans'`)));
  await document.fonts.ready;
}
