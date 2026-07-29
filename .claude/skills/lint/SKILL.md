---
name: lint
description: Run ESLint, Stylelint and Prettier across the whole src/ codebase, auto-fixing what can be fixed and reporting what cannot.
---

# Linting Eagle Animation

Runs the project's three linters over `src/**` in order, auto-fixing in place. Every
tool has `--fix`/`--write` on, so a clean run leaves the tree formatted; a failing
run means there are issues no tool could fix automatically — report those.

## The one command

Run from the repo root:

```bash
npm run lint
```

This is the whole task. It chains, in order (each only runs if the previous passed):

| Step | Command | What it does |
|---|---|---|
| 1. ESLint | `eslint ./src/ --ext .js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --max-warnings 0` | JS/JSX rules; **zero warnings tolerated** |
| 2. Stylelint | `stylelint src/**/*.css --fix` | CSS Modules / stylesheet rules |
| 3. Prettier | `prettier --write src/**/*.{js,jsx,ts,tsx,css,json,md,html}` | Formatting |

Because the chain uses `&&`, a failure in ESLint stops it before Stylelint/Prettier
run. That's expected — fix the reported errors and run `npm run lint` again.

## Running a single linter

When you only touched one kind of file, or want to isolate a failure:

```bash
npm run lint:eslint      # JS/JSX only
npm run lint:stylelint   # CSS only
npm run lint:prettier    # formatting only
```

## Reading the result

- **Exit 0, no output of concern** → the codebase is clean (anything fixable was
  fixed in place). Report success and mention if files were modified (`git status`).
- **ESLint errors** → these are rule violations `--fix` could not resolve
  (unused vars, undefined names, hook-dependency issues…). They must be fixed by
  hand in the source. Note `--max-warnings 0` means even a single warning fails the
  step.
- **Stylelint errors** → unfixable CSS issues; edit the offending `.css` file.

## After running

The linters modify files in place.
Do not commit unless the user asked — just report what was fixed and what still
needs manual attention.
