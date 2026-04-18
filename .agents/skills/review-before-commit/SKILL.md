---
name: review-before-commit
description: Pre-commit quality review for Clickido that checks TypeScript strictness, CSS Module conventions, Zustand patterns, and import structure. Use before committing, when asked to review recent changes, or to verify code quality.
---

# Review Before Commit

## Step 1 — Get changed files

```bash
git diff --name-only
git diff --cached --name-only
```

## Step 2 — Check each category

### TypeScript (*.tsx, *.ts)
- [ ] No `any` — use `unknown` or proper types
- [ ] Props interfaces defined explicitly (not inline)
- [ ] Named exports only (no `export default`)
- [ ] No unused imports
- [ ] Service files do not import from React

### CSS Modules (*.module.css)
- [ ] Colors use `:root` variables (no hardcoded hex)
- [ ] Spacing uses `:root` variables where defined
- [ ] Responsive: works at 360 / 480 / 768 / 1024px
- [ ] No `!important` (unless overriding third-party)
- [ ] Class names are camelCase in TSX usage

### Zustand store
- [ ] New actions have correct TypeScript types
- [ ] `version` in persist middleware bumped if data shape changed
- [ ] Migration function added for breaking schema changes

### Imports
- [ ] Relative imports within the same module
- [ ] No circular dependencies
- [ ] `index.ts` barrel files updated for new exports

## Step 3 — Report

Format: `file:line — problem — suggestion`

If no issues found: "Clean. Ready to commit."

## Rules

- Read ONLY the changed files — do not scan the whole codebase
- Do NOT auto-fix — report issues and let the user decide
- Always run `npm run build` to verify TypeScript compilation
