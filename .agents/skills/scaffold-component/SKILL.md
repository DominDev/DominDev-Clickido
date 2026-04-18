---
name: scaffold-component
description: Creates a new React component for the Clickido project following project conventions — TSX file, CSS Module, and index.ts barrel export. Use when asked to create, add, or scaffold a new component, UI element, or piece of the interface.
---

# Scaffold React Component

Do NOT read existing components to discover the pattern — use the rules below.

## Input required

Component name, target category (infer from purpose if not given), brief description of what it does.

## Files to create

For `ComponentName` in `src/components/{category}/`:

1. **`ComponentName.tsx`** — functional component with TypeScript
2. **`ComponentName.module.css`** — scoped CSS Module
3. **Update `index.ts`** in the category directory — add named export

## TSX template

```tsx
import { type FC } from 'react';
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  // explicit prop types — no any
}

export const ComponentName: FC<ComponentNameProps> = ({ /* props */ }) => {
  return (
    <div className={styles.root}>
      {/* content */}
    </div>
  );
};
```

## CSS Module template

```css
.root {
  /* layout */
}
```

## index.ts export

```ts
export { ComponentName } from './ComponentName';
```

## Category directories

- `layout/` — navigation, bars, strips, layout wrappers
- `task/` — task cards, lists, forms
- `ui/` — buttons, modals, inputs, toasts, icons
- `onboarding/` — install banners, onboarding flows
- `screensaver/` — screensaver

## Rules

- CSS Modules only — no inline styles
- Use `:root` CSS variables for colors and spacing
- TypeScript strict: explicit prop interfaces, no `any`
- Named exports only — no `export default`
- Framer Motion available for animations
