---
name: clickido-conventions
description: Coding conventions for the Clickido project (React 18, TypeScript, CSS Modules, Zustand). Activates automatically when creating or modifying components, store actions, services, or styles. Provides correct patterns without reading existing files.
---

# Clickido Coding Conventions

## Component structure

Every component = 3 files:

```
ComponentName.tsx         ← functional component, TypeScript
ComponentName.module.css  ← scoped styles (CSS Modules)
index.ts                  ← re-export: export { ComponentName } from './ComponentName'
```

### TSX template

```tsx
import { type FC } from 'react';
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  // explicit types, no any
}

export const ComponentName: FC<ComponentNameProps> = ({ /* props */ }) => {
  return <div className={styles.root}>{/* content */}</div>;
};
```

Rules:
- Named exports only (no `export default`)
- Props interface always explicit (not inline)
- No `any` — use `unknown` or proper types
- Services never import from React

## CSS Modules

```css
.root { /* layout */ }
.title { /* typography */ }
```

Rules:
- Class names: camelCase in CSS → `styles.myClass` in TSX
- Colors: always `:root` variables (`var(--color-primary)`)
- Spacing: prefer `:root` variables (`var(--spacing-md)`)
- No `!important` except third-party overrides
- No hardcoded hex values

## Zustand store

```ts
// src/store/taskStore.ts
interface StoreState {
  items: Item[];
  addItem: (item: Item) => void;
}

const useStore = create<StoreState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
    }),
    { name: 'clickido-store', version: 2 }  // bump version on schema change
  )
);
```

Rules:
- Single store file: `src/store/taskStore.ts`
- Bump `version` when data shape changes
- Add `migrate` function for breaking changes

## Services

```ts
// src/services/myService.ts — NO React imports
export function calculatePoints(task: Task): number {
  // pure business logic
}
```

## File categories in src/components/

- `layout/` — navigation, bars, wrappers
- `task/` — task cards, lists, forms
- `ui/` — buttons, modals, toasts, icons
- `onboarding/` — install banners, onboarding
- `screensaver/` — screensaver
