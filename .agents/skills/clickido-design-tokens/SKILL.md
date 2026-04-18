---
name: clickido-design-tokens
description: Design system reference for Clickido — colors, typography, spacing, breakpoints, animations, Kids Mode rules. Activates when working on CSS, styling, visual changes, or component appearance.
---

# Clickido Design Tokens

## Themes

Two themes via `:root` CSS variables: **Day** (bright, warm) and **Night** (dark, calm).
Kids Mode uses larger elements and stronger emoji emphasis on top of either theme.

## Color roles (use these names, not hex values)

```css
/* Primary actions */
--color-primary        /* Orange accent — main CTAs, active states */
--color-primary-hover  /* Darker primary for hover */

/* Backgrounds */
--color-bg             /* Page background */
--color-surface        /* Card/panel background */
--color-surface-alt    /* Secondary surfaces */

/* Text */
--color-text           /* Primary text */
--color-text-secondary /* Muted/secondary text */
--color-text-disabled  /* Disabled state */

/* Semantic */
--color-success        /* Completion, positive feedback */
--color-warning        /* Alerts, caution */
--color-error          /* Errors, destructive actions */

/* Border */
--color-border         /* Subtle borders */
--color-border-strong  /* Prominent borders */
```

## Typography

```css
/* Font families */
--font-heading  /* Quicksand — headings, labels */
--font-body     /* Nunito — body text, descriptions */

/* Scale */
--text-xs    /* 12px */
--text-sm    /* 14px */
--text-base  /* 16px */
--text-lg    /* 18px */
--text-xl    /* 20px */
--text-2xl   /* 24px */
--text-3xl   /* 30px */
--text-4xl   /* 36px — Kids Mode titles */
```

## Spacing

```css
--spacing-xs   /* 4px */
--spacing-sm   /* 8px */
--spacing-md   /* 16px */
--spacing-lg   /* 24px */
--spacing-xl   /* 32px */
--spacing-2xl  /* 48px */
```

## Border radius

```css
--radius-sm   /* 4px — subtle rounding */
--radius-md   /* 8px — cards, buttons */
--radius-lg   /* 16px — modals, panels */
--radius-xl   /* 24px — large surfaces */
--radius-full /* 9999px — pills, avatars */
```

## Breakpoints (tablet-first)

```css
/* Target device: tablet landscape */
@media (max-width: 1024px) { /* tablet portrait */ }
@media (max-width: 768px)  { /* large phone */ }
@media (max-width: 480px)  { /* phone */ }
@media (max-width: 360px)  { /* small phone */ }
```

## Animations

```css
--duration-fast    /* 150ms — micro-interactions */
--duration-normal  /* 250ms — standard transitions */
--duration-slow    /* 400ms — entrances, larger moves */
--ease-default     /* cubic-bezier(.4,0,.2,1) */
```

Always respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  /* disable or simplify animation */
}
```

## Kids Mode rules

- Touch targets: minimum 56px × 56px
- Font size: minimum `--text-xl` for interactive labels
- Text: minimal — let emoji/icons carry meaning
- Task tiles: entire tile is the touch target (not just checkbox)
- Bottom nav: shorter, brighter, more prominent
- No date/time display in header
- Auto-redirect to today's view (children don't navigate by date)

## Z-index scale

```
1    — base content
10   — sticky elements (TopBar, BottomNav)
100  — dropdowns, tooltips
1000 — modals, overlays
9999 — toasts
```

## For full design system detail

Read `_docs/04-DESIGN-SYSTEM.md`
