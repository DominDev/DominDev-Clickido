---
name: clickido-architecture
description: Architecture map for the Clickido project — file responsibilities, data flow, layer boundaries, routing, and current MVP state. Activates when asked about project structure, where to add something, how data flows, or which file to modify.
---

# Clickido Architecture

## File → Responsibility map

```
src/
├── App.tsx                  → Router setup, global providers, Layout wrapper
├── main.tsx                 → React entry point, StrictMode
│
├── pages/                   → One file per route
│   ├── TasksPage.tsx        → Task CRUD, templates, task database
│   ├── PointsPage.tsx       → Points display, motivation metrics
│   └── SettingsPage.tsx     → App settings, parent PIN, dark mode, JSON backup
│
├── components/
│   ├── layout/              → Layout.tsx, TopBar.tsx, BottomNav.tsx, DayStrip.tsx
│   ├── task/                → TaskCard.tsx, TaskList.tsx, TaskForm.tsx
│   ├── ui/                  → Button, Checkbox, Toast, PinModal, ProgressRing,
│   │                           PointsTile, RewardModal, KidsStarIcon
│   ├── onboarding/          → OnboardingFlow.tsx, InstallBanner.tsx
│   └── screensaver/         → Screensaver.tsx
│
├── store/
│   └── taskStore.ts         → Single Zustand store: tasks, completions, settings, rewards
│
├── services/
│   ├── storageService.ts    → localStorage persistence, version migration
│   └── completionService.ts → Task completion logic, point calculation
│
├── hooks/                   → useScreensaver, useTheme, useWakeLock
├── types/                   → TypeScript type definitions
├── utils/                   → Date helpers (date-fns), formatting, categories, recurrence
└── styles/                  → Global CSS, :root theme variables
```

## Data flow

```
User action
  → Page component (UI event handler)
    → Store action (Zustand)
      → Service function (business logic, no React)
        → localStorage (via persist middleware)
  → UI re-render ← Zustand selector ← Store state update
```

## Layer rules

| Layer | Imports FROM | Must NOT import |
|-------|-------------|-----------------|
| `pages/` | components, hooks, store | services directly |
| `components/` | ui components, hooks, store | pages |
| `store/` | types, services | React, components |
| `services/` | types, utils | React, store, components |
| `hooks/` | store, utils | pages, services |

## Routing

- Base path: `/app/`
- Routes defined in `App.tsx`
- Kids Mode auto-redirects to today's view

## MVP state (active features)

- Today view with task list and daily progress
- Task CRUD with templates and recurrence
- Points system (basic display)
- Settings: dark mode, Kids Mode, parent PIN, screensaver, backup
- Onboarding flow and PWA install banner
- Screensaver with transitions

## Not yet implemented

- Multi-user profiles
- Cloud synchronization
- Reward shop and badges
- Automated tests
- Advanced analytics

## For deeper detail

- Full architecture: `_docs/02-ARCHITEKTURA.md`
- Feature specs: `_docs/03-FUNKCJONALNOSCI.md`
- Implementation status: `_docs/report-stan-wdrozenia.md`
