---
name: project-context
description: Loads a concise architecture cheat sheet for the Clickido project — tech stack, file-to-responsibility map, conventions, design basics, and current MVP state. Use at session start, when orientation is needed, or when asked about project structure.
---

# Clickido — Project Context

## What is it?

Family task management PWA for a wall/stand-mounted tablet. Two modes: **Parent** (admin, task management) and **Kids** (simplified, emoji-driven). Local-only data (localStorage), no backend yet.

## Tech stack

React 18 · TypeScript · Vite 6 · Zustand (persist) · CSS Modules · Framer Motion · date-fns · React Router · vite-plugin-pwa

## File → Responsibility

```
src/
├── App.tsx                 → Router, providers, Layout wrapper
├── pages/
│   ├── TasksPage.tsx       → Task CRUD, templates
│   ├── PointsPage.tsx      → Points display
│   └── SettingsPage.tsx    → Settings, PIN, dark mode, backup
├── components/
│   ├── layout/             → Layout, TopBar, BottomNav, DayStrip
│   ├── task/               → TaskCard, TaskList, TaskForm
│   ├── ui/                 → Button, Checkbox, Toast, PinModal, ProgressRing, RewardModal
│   ├── onboarding/         → OnboardingFlow, InstallBanner
│   └── screensaver/        → Screensaver
├── store/taskStore.ts      → Single Zustand store (tasks, completions, settings)
├── services/
│   ├── storageService.ts   → localStorage + migrations
│   └── completionService.ts → completion logic, points
├── hooks/                  → useScreensaver, useTheme, useWakeLock
├── types/                  → TypeScript definitions
├── utils/                  → date-fns helpers, formatting, categories
└── styles/                 → Global CSS, :root theme variables
```

## Key conventions

- Component = `Name.tsx` + `Name.module.css` + named export in `index.ts`
- CSS Modules, `:root` variables, no BEM, no inline styles
- Single Zustand store with persist middleware
- Business logic in `services/` — no React imports there
- Strict TypeScript, no `any`

## Design

- Tablet-first (landscape), responsive to 360px
- Day / Night themes via `:root` variables
- Fonts: Quicksand (headings), Nunito (body)
- Kids Mode: 56px+ touch targets, emoji-driven, minimal text

## MVP active

Today view · Task CRUD · Points · Settings · Onboarding · Screensaver · Dark mode · Kids mode · JSON backup

## Not yet built

Multi-user · Cloud sync · Reward shop · Automated tests

## Deeper docs (read only when needed)

- Architecture: `_docs/02-ARCHITEKTURA.md`
- Features: `_docs/03-FUNKCJONALNOSCI.md`
- Design system: `_docs/04-DESIGN-SYSTEM.md`
- UX scenarios: `_docs/05-SCENARIUSZE-UX.md`
- Status: `_docs/report-stan-wdrozenia.md`
