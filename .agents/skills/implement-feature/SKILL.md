---
name: implement-feature
description: Tiered feature implementation workflow for Clickido that scales the number of clarifying questions to task complexity — 0-1 questions for small tasks, 2-3 for medium, 5-8 for large. Use when asked to add functionality, implement a feature, or build something new in the app.
---

# Implement Feature

## Step 1 — Classify task size (silently)

Assess complexity from the request:

- **Small** (1-2 files, single component change): 0-1 questions → go straight to plan
- **Medium** (3-5 files, crosses component-store boundary): 2-3 questions → plan
- **Large** (6+ files, new page/system, architecture decision): 5-8 questions → plan

Tell the user the classification and why.

## Step 2 — Ask only what you don't know

Skip questions whose answer is obvious from context. Focus on:
- Ambiguous UX decisions
- Data model choices
- Scope boundaries

## Step 3 — Short plan

Numbered list of files to create/modify. Max one sentence per file. Wait for OK.

## Step 4 — Implement

Project conventions:
- **Components**: TSX + CSS Module + index.ts export
- **Store changes**: actions + types in `src/store/taskStore.ts`
- **Services**: business logic in `src/services/` — no React imports
- **Pages**: in `src/pages/`, register route in `App.tsx`
- **Types**: in `src/types/`

## Read these only when needed

- Data flow questions → `_docs/02-ARCHITEKTURA.md`
- Design tokens → `_docs/04-DESIGN-SYSTEM.md`
- UX scenarios → `_docs/05-SCENARIUSZE-UX.md`

## Rules

- Prefer targeted edits over full file rewrites
- Verify build after implementation: `npm run build`
- Do not refactor surrounding code that isn't broken
