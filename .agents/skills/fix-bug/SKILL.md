---
name: fix-bug
description: Diagnoses and fixes bugs in the Clickido project by identifying the affected architecture layer first, then reading only the minimum necessary files. Use when something is broken, behaves unexpectedly, has a visual glitch, or throws an error.
---

# Fix Bug

## Step 1 — Identify the layer

Match the symptom to the most likely layer:

| Symptom | Start here |
|---------|-----------|
| Visual / layout issue | `src/components/` or `*.module.css` |
| Wrong data or state | `src/store/taskStore.ts` |
| Business logic error | `src/services/` |
| Routing or page issue | `src/pages/` + `src/App.tsx` |
| Date / time bug | `src/utils/` (date-fns helpers) |
| TypeScript / build error | Run `npm run build`, read the output |

## Step 2 — Read minimum files

Read ONLY the suspected file(s). Use grep to find relevant code instead of reading entire files. Do not read documentation unless the bug relates to a design decision.

## Step 3 — Diagnose

State the root cause in 1-2 sentences. Show the problematic code with line numbers.

## Step 4 — Fix

- Surgical edit — change only what is broken
- Do not refactor surrounding code
- Do not add explanatory comments about the fix

## Step 5 — Verify

Run `npm run build` to confirm TypeScript compiles. If the fix touches the Zustand store, verify the persist middleware version won't break existing localStorage data.

## Data flow reference

```
User action → Page → Store action → Service → localStorage
                ↓
        UI re-render ← Zustand selector ← Store state
```
