---
name: translate
description: Extract new UI strings and translate every language file in resources/i18n, leaving no key untranslated.
---

# Translating Eagle Animation

Fills in every missing translation across all `resources/i18n/*.json` files so no
`__NOT_TRANSLATED__` sentinel remains.

## How the i18n model works

- The scanner (`i18next-scanner`, config at repo root) collects every `t('...')`
  call in `src/**`.
- Keys **are** the English source strings. Files are a **flat** map, no nesting,
  no namespaces (`nsSeparator`/`keySeparator` are off).
- `en.json` maps each key to itself. Every other language maps the English key to
  its translation, or to the literal `__NOT_TRANSLATED__` for keys nobody has
  translated yet.
- Interpolation uses `{{variable}}` — these placeholders must survive translation
  **verbatim**.

Languages (22 besides English): bg, cs, da, de, el, eo, es, fi, fr, hr, hu, it,
lt, lv, nl, pl, pt, ro, ru, sk, sl, sv.

## Procedure

### 1. Extract strings

Run from the repo root — this adds any new keys and stamps `__NOT_TRANSLATED__`
into every non-English file:

```bash
npm run extract-strings
```

### 2. See what needs translating

```bash
node .claude/skills/translate/scripts/untranslated.mjs
```

Prints a per-language count and a total. `0` everywhere means you're done — stop.
Otherwise translate each language that has a non-zero count.

### 3. Translate, one language at a time

For each language with missing keys, get a fill-in skeleton (a JSON object of the
untranslated English keys mapped to empty strings):

```bash
node .claude/skills/translate/scripts/untranslated.mjs --lang fr --skeleton
```

Translate each English key into the target language and fill the values. Rules:

- **Keep `{{placeholders}}` exactly** — same name, same braces, do not translate or
  reorder their surrounding words in a way that drops them.
- **Keep the meaning and the UI tone** — these are terse button/label/toast
  strings, not prose. Match length and register.
- **Preserve** leading/trailing spaces, trailing `:` / `…`, capitalization style,
  and any HTML/markup or format specifiers.
- **Do not translate** the product name "Eagle Animation", "Brick à Brack", or
  language endonyms that are themselves keys ("English", "Français", "Deutsch"…) —
  leave those as-is.
- Never leave a value empty and never write `__NOT_TRANSLATED__` yourself.

Write the completed map to a scratch file, then apply it — the script only
overwrites `__NOT_TRANSLATED__` values, preserves key order and formatting, and
reports anything it skipped:

```bash
# after writing e.g. /tmp/fr.json  (or pipe via - )
node .claude/skills/translate/scripts/apply.mjs fr /tmp/fr.json
```

For many languages, translate them in parallel with subagents (one language per
agent, each returning its filled map), then `apply.mjs` each result. This keeps
each context small and avoids mixing languages.

### 4. Verify nothing is left

```bash
node .claude/skills/translate/scripts/untranslated.mjs   # must print total 0 (exit 0)
```

Then keep the files consistent with repo formatting:

```bash
npx prettier --write resources/i18n/*.json
```

The task is complete only when the summary reports **0 untranslated** across all 22
languages.
