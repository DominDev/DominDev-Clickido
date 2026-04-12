/**
 * Categories - Task category definitions and templates
 */

import { Category, CategoryId, TaskTemplate } from '@/types';

export const CATEGORIES: Category[] = [
  {
    id: 'kitchen',
    label: 'Kuchnia',
    emoji: '🍳',
    color: 'var(--color-category-kitchen)',
  },
  {
    id: 'bathroom',
    label: 'Łazienka',
    emoji: '🚿',
    color: 'var(--color-category-bathroom)',
  },
  {
    id: 'living',
    label: 'Pokoje',
    emoji: '🛋️',
    color: 'var(--color-category-living)',
  },
  {
    id: 'laundry',
    label: 'Pranie',
    emoji: '👕',
    color: 'var(--color-category-laundry)',
  },
  {
    id: 'shopping',
    label: 'Zakupy',
    emoji: '🛒',
    color: 'var(--color-category-shopping)',
  },
  {
    id: 'pets',
    label: 'Zwierzęta',
    emoji: '🐕',
    color: 'var(--color-category-pets)',
  },
  {
    id: 'other',
    label: 'Inne',
    emoji: '📋',
    color: 'var(--color-category-other)',
  },
];

export const CATEGORY_MAP = new Map<CategoryId, Category>(
  CATEGORIES.map((c) => [c.id, c])
);

export function getCategoryById(id: CategoryId): Category | undefined {
  return CATEGORY_MAP.get(id);
}

export function getCategoryColor(id: CategoryId): string {
  return CATEGORY_MAP.get(id)?.color ?? 'var(--color-category-other)';
}

export function getCategoryEmoji(id: CategoryId): string {
  return CATEGORY_MAP.get(id)?.emoji ?? '📋';
}

export function getCategoryLabel(id: CategoryId): string {
  return CATEGORY_MAP.get(id)?.label ?? 'Inne';
}

// Task templates per category
export const TASK_TEMPLATES: Record<CategoryId, TaskTemplate[]> = {
  kitchen: [
    { title: 'Przygotuj śniadanie', emoji: '🍳', category: 'kitchen', estimatedMinutes: 15 },
    { title: 'Przygotuj obiad', emoji: '🥘', category: 'kitchen', estimatedMinutes: 45 },
    { title: 'Przygotuj kolację', emoji: '🍽️', category: 'kitchen', estimatedMinutes: 30 },
    { title: 'Umyj naczynia', emoji: '🍽️', category: 'kitchen', estimatedMinutes: 15 },
    { title: 'Wynieś śmieci', emoji: '🗑️', category: 'kitchen', estimatedMinutes: 5 },
    { title: 'Wyczyść lodówkę', emoji: '🧊', category: 'kitchen', estimatedMinutes: 20 },
    { title: 'Wyczyść piekarnik', emoji: '🔥', category: 'kitchen', estimatedMinutes: 30 },
  ],
  bathroom: [
    { title: 'Wyczyść toaletę', emoji: '🚽', category: 'bathroom', estimatedMinutes: 10 },
    { title: 'Wyczyść lustro', emoji: '🪞', category: 'bathroom', estimatedMinutes: 5 },
    { title: 'Umyj podłogę', emoji: '🧹', category: 'bathroom', estimatedMinutes: 15 },
    { title: 'Wyczyść wannę/prysznic', emoji: '🛁', category: 'bathroom', estimatedMinutes: 15 },
    { title: 'Wymień ręczniki', emoji: '🧴', category: 'bathroom', estimatedMinutes: 5 },
  ],
  living: [
    { title: 'Odkurz pokój', emoji: '🧹', category: 'living', estimatedMinutes: 20 },
    { title: 'Zetrzyj kurze', emoji: '🧽', category: 'living', estimatedMinutes: 15 },
    { title: 'Pościel łóżko', emoji: '🛏️', category: 'living', estimatedMinutes: 5 },
    { title: 'Podlej kwiaty', emoji: '🌱', category: 'living', estimatedMinutes: 10 },
    { title: 'Umyj okna', emoji: '🪟', category: 'living', estimatedMinutes: 30 },
    { title: 'Posprzątaj biurko', emoji: '🗂️', category: 'living', estimatedMinutes: 10 },
  ],
  laundry: [
    { title: 'Włącz pranie (białe)', emoji: '⚪', category: 'laundry', estimatedMinutes: 5 },
    { title: 'Włącz pranie (kolorowe)', emoji: '🌈', category: 'laundry', estimatedMinutes: 5 },
    { title: 'Rozwieś pranie', emoji: '👕', category: 'laundry', estimatedMinutes: 15 },
    { title: 'Złóż pranie', emoji: '📦', category: 'laundry', estimatedMinutes: 20 },
    { title: 'Prasuj ubrania', emoji: '👔', category: 'laundry', estimatedMinutes: 30 },
    { title: 'Zmień pościel', emoji: '🛏️', category: 'laundry', estimatedMinutes: 15 },
  ],
  shopping: [
    { title: 'Zakupy spożywcze', emoji: '🛒', category: 'shopping', estimatedMinutes: 45 },
    { title: 'Sprawdź pocztę', emoji: '📬', category: 'shopping', estimatedMinutes: 5 },
    { title: 'Apteka', emoji: '💊', category: 'shopping', estimatedMinutes: 20 },
    { title: 'Opłać rachunki', emoji: '💳', category: 'shopping', estimatedMinutes: 15 },
  ],
  pets: [
    { title: 'Wyprowadź psa (rano)', emoji: '🐕', category: 'pets', estimatedMinutes: 20 },
    { title: 'Wyprowadź psa (wieczór)', emoji: '🌙', category: 'pets', estimatedMinutes: 30 },
    { title: 'Nakarm zwierzęta', emoji: '🍖', category: 'pets', estimatedMinutes: 5 },
    { title: 'Wyczyść kuwetę', emoji: '🐱', category: 'pets', estimatedMinutes: 10 },
    { title: 'Szczotkuj zwierzę', emoji: '🧹', category: 'pets', estimatedMinutes: 15 },
  ],
  other: [
    { title: 'Nowe zadanie', emoji: '📋', category: 'other', estimatedMinutes: 15 },
  ],
};

export function getTemplatesForCategory(categoryId: CategoryId): TaskTemplate[] {
  return TASK_TEMPLATES[categoryId] || TASK_TEMPLATES.other;
}

export function getAllTemplates(): TaskTemplate[] {
  return Object.values(TASK_TEMPLATES).flat();
}

// Emoji picker categories
export const EMOJI_CATEGORIES = {
  household: ['🧹', '🧽', '🧴', '🚿', '🛁', '🚽', '🪞', '🧺'],
  kitchen: ['🍳', '🥘', '🍽️', '🍴', '🥄', '🗑️', '🧊', '🔥'],
  cleaning: ['🧼', '🧻', '🧽', '🧹', '🪣', '🧪', '✨', '💧'],
  laundry: ['👕', '👔', '👗', '🧥', '👖', '🧦', '📦', '🌈'],
  garden: ['🌱', '🌷', '🌻', '🪴', '🌿', '🍃', '🪻', '🌸'],
  pets: ['🐕', '🐱', '🐦', '🐠', '🐹', '🐰', '🦜', '🐢'],
  general: ['📋', '✅', '⭐', '💪', '🎯', '🏆', '⏰', '📅'],
};

export function getAllEmojis(): string[] {
  return Object.values(EMOJI_CATEGORIES).flat();
}
