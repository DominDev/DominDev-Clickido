/**
 * BottomNav - Bottom navigation bar
 */

import { NavLink } from 'react-router-dom';
import { useSettingsStore } from '@store/settingsStore';
import styles from './BottomNav.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { path: '/today', label: 'Dziś', icon: '📋' },
  { path: '/points', label: 'Punkty', icon: '⭐' },
  { path: '/tasks', label: 'Zadania', icon: '🧩' },
  { path: '/settings', label: 'Ustawienia', icon: '⚙️' },
];

const KIDS_NAV_ITEMS: NavItem[] = [
  { path: '/today', label: 'Dziś', icon: '📋' },
  { path: '/points', label: 'Moje punkty', icon: '⭐' },
];

export default function BottomNav() {
  const { display } = useSettingsStore();
  const navItems = display.kidsMode ? KIDS_NAV_ITEMS : DEFAULT_NAV_ITEMS;

  return (
    <nav className={styles.nav} aria-label="Główna nawigacja">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `${styles.navItem} ${display.kidsMode ? styles.kidsMode : ''} ${
              isActive ? styles.active : ''
            }`
          }
        >
          <span className={styles.icon} aria-hidden="true">
            {item.icon}
          </span>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
