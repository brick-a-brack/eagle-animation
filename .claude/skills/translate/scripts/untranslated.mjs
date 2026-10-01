// Reports untranslated i18n keys, or emits the keys of one language as JSON.
//
//   node untranslated.mjs                 → summary table (all languages)
//   node untranslated.mjs --lang fr       → JSON array of fr's untranslated keys
//   node untranslated.mjs --lang fr --skeleton
//                                         → JSON object { "<english key>": "" } to fill in
//
// Keys ARE the English source strings (flat map). A value of "__NOT_TRANSLATED__"
// marks a key the scanner added but nobody has translated yet.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const SENTINEL = '__NOT_TRANSLATED__';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const I18N_DIR = join(ROOT, 'resources/i18n');

const args = process.argv.slice(2);
const langFlag = args.indexOf('--lang');
const lang = langFlag !== -1 ? args[langFlag + 1] : null;
const skeleton = args.includes('--skeleton');

const load = (code) => JSON.parse(readFileSync(join(I18N_DIR, `${code}.json`), 'utf8'));
const untranslatedKeys = (obj) => Object.entries(obj).filter(([, v]) => v === SENTINEL).map(([k]) => k);

if (lang) {
  const keys = untranslatedKeys(load(lang));
  if (skeleton) {
    console.log(JSON.stringify(Object.fromEntries(keys.map((k) => [k, ''])), null, 2));
  } else {
    console.log(JSON.stringify(keys, null, 2));
  }
} else {
  const files = readdirSync(I18N_DIR).filter((f) => f.endsWith('.json') && f !== 'en.json');
  let total = 0;
  for (const file of files.sort()) {
    const count = untranslatedKeys(load(file.replace('.json', ''))).length;
    total += count;
    console.log(`${file.replace('.json', '').padEnd(4)} ${count}`);
  }
  console.log(`---\ntotal ${total} untranslated across ${files.length} languages`);
  if (total > 0) {
    process.exitCode = 1;
  }
}
