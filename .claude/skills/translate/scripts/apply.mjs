// Merges a { "<english key>": "<translation>" } map into one language file,
// replacing only "__NOT_TRANSLATED__" values. Preserves key order and the
// scanner's format (2-space indent, trailing newline). Safe against JSON escaping
// pitfalls of hand-editing.
//
//   node apply.mjs fr path/to/translations.json
//   node apply.mjs fr -            (reads the JSON map from stdin)
//
// Refuses to overwrite an already-translated value and reports any provided key
// that is missing or wasn't awaiting translation, so mistakes surface loudly.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const SENTINEL = '__NOT_TRANSLATED__';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

const [lang, mapPath] = process.argv.slice(2);
if (!lang || !mapPath) {
  console.error('usage: node apply.mjs <lang> <translations.json | ->');
  process.exit(2);
}

const filePath = join(ROOT, 'resources/i18n', `${lang}.json`);
const obj = JSON.parse(readFileSync(filePath, 'utf8'));
const map = JSON.parse(mapPath === '-' ? readFileSync(0, 'utf8') : readFileSync(resolve(mapPath), 'utf8'));

let applied = 0;
const skipped = [];
for (const [key, value] of Object.entries(map)) {
  if (!(key in obj)) {
    skipped.push(`missing key: ${JSON.stringify(key)}`);
    continue;
  }
  if (obj[key] !== SENTINEL) {
    skipped.push(`already translated: ${JSON.stringify(key)}`);
    continue;
  }
  if (typeof value !== 'string' || value.trim() === '' || value === SENTINEL) {
    skipped.push(`empty/invalid translation for: ${JSON.stringify(key)}`);
    continue;
  }
  obj[key] = value;
  applied += 1;
}

writeFileSync(filePath, `${JSON.stringify(obj, null, 2)}\n`);

const remaining = Object.values(obj).filter((v) => v === SENTINEL).length;
console.log(`${lang}: applied ${applied}, ${remaining} still untranslated`);
if (skipped.length) {
  console.log(`skipped ${skipped.length}:\n  ${skipped.join('\n  ')}`);
}
