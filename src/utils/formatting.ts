/**
 * Formatting utilities - Date, time, and text formatting
 */

import { format, isToday, isYesterday, isTomorrow } from 'date-fns';
import { pl } from 'date-fns/locale';

/**
 * Format date in Polish (e.g., "środa, 8 kwietnia")
 */
export function formatDateFull(date: Date): string {
  return format(date, "EEEE, d MMMM", { locale: pl });
}

/**
 * Format date short (e.g., "8 kwi")
 */
export function formatDateShort(date: Date): string {
  return format(date, "d MMM", { locale: pl });
}

/**
 * Format time 24h (e.g., "14:35")
 */
export function formatTime(date: Date, showSeconds: boolean = false): string {
  const pattern = showSeconds ? 'HH:mm:ss' : 'HH:mm';
  return format(date, pattern);
}

/**
 * Format relative date (Dziś, Wczoraj, Jutro, or date)
 */
export function formatRelativeDate(date: Date): string {
  if (isToday(date)) return 'Dziś';
  if (isYesterday(date)) return 'Wczoraj';
  if (isTomorrow(date)) return 'Jutro';
  return formatDateFull(date);
}

/**
 * Format minutes to human readable string
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} godz.`;
  }

  return `${hours} godz. ${remainingMinutes} min`;
}

/**
 * Format points with pluralization
 */
export function formatPoints(points: number): string {
  if (points === 1) return '1 punkt';
  if (points >= 2 && points <= 4) return `${points} punkty`;
  if (points >= 5 && points <= 21) return `${points} punktów`;

  // Handle larger numbers
  const lastDigit = points % 10;
  const lastTwoDigits = points % 100;

  if (lastTwoDigits >= 12 && lastTwoDigits <= 14) {
    return `${points} punktów`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${points} punkty`;
  }

  return `${points} punktów`;
}

/**
 * Format tasks count with pluralization
 */
export function formatTasksCount(count: number): string {
  if (count === 0) return 'Brak zadań';
  if (count === 1) return '1 zadanie';
  if (count >= 2 && count <= 4) return `${count} zadania`;
  return `${count} zadań`;
}

/**
 * Get day name abbreviation (Pn, Wt, Śr, Cz, Pt, So, Nd)
 */
export function getDayAbbreviation(dayIndex: number): string {
  const days = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
  return days[dayIndex] || '';
}

/**
 * Get full day name
 */
export function getDayName(dayIndex: number): string {
  const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
  return days[dayIndex] || '';
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Get motivational message based on progress
 */
export function getMotivationalMessage(percentage: number): string {
  if (percentage === 0) return 'Czas zacząć! 💪';
  if (percentage < 25) return 'Dobry początek!';
  if (percentage < 50) return 'Świetnie ci idzie!';
  if (percentage < 75) return 'Ponad połowa za Tobą!';
  if (percentage < 100) return 'Jeszcze trochę!';
  return 'Wszystko zrobione! 🎉';
}
