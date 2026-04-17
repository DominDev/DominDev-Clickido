/**
 * BottomNav - Bottom navigation bar with integrated FAB
 */

import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSettingsStore } from '@store/settingsStore';
import { useUIStore } from '@store/uiStore';
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
  { path: '/today', label: 'Dziś', icon: '🧸' },
  { path: '/points', label: 'Nagrody', icon: '🏆' },
];

export default function BottomNav() {
  const { display } = useSettingsStore();
  const { openModal } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const navItems = display.kidsMode ? KIDS_NAV_ITEMS : DEFAULT_NAV_ITEMS;
  const isPointsPage = location.pathname === '/points';

  const handleOpenQuickTask = () => {
    setQuickMenuOpen(false);
    openModal('taskForm');
  };

  const handleOpenTaskBase = () => {
    setQuickMenuOpen(false);
    navigate('/tasks');
  };

  const handleFabClick = () => {
    // Toggle quick menu (both pages have menus now)
    setQuickMenuOpen((current) => !current);
  };

  const handleAddReward = (audience: 'family' | 'child' | 'adult') => {
    setQuickMenuOpen(false);
    openModal('rewardForm', { audience });
  };

  return (
    <>
      <nav className={`${styles.nav} ${display.kidsMode ? styles.kidsNav : ''}`} aria-label="Główna nawigacja">
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
            <span className={styles.iconWrap}>
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
            </span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}

        {!display.kidsMode && (
          <>
            <span className={styles.separator} aria-hidden="true" />
            <button
              type="button"
              className={`${styles.fab} ${quickMenuOpen ? styles.fabOpen : ''}`}
              onClick={handleFabClick}
              aria-label={isPointsPage ? 'Dodaj nagrodę' : 'Otwórz szybkie akcje'}
              aria-expanded={quickMenuOpen}
            >
              <span aria-hidden="true">{quickMenuOpen ? '×' : '＋'}</span>
            </button>
          </>
        )}
      </nav>

      {!display.kidsMode && quickMenuOpen && !isPointsPage && (
        <div className={styles.quickMenuOverlay} onClick={() => setQuickMenuOpen(false)}>
          <div className={styles.quickMenu} role="menu" aria-label="Szybkie akcje" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.quickMenuAction}
              onClick={handleOpenQuickTask}
              role="menuitem"
            >
              <span className={styles.quickMenuEmoji} aria-hidden="true">
                ⚡
              </span>
              <span className={styles.quickMenuText}>
                <strong>Szybkie zadanie</strong>
                <span>Dodaj nowe zadanie od razu.</span>
              </span>
            </button>

            <button
              type="button"
              className={styles.quickMenuAction}
              onClick={handleOpenTaskBase}
              role="menuitem"
            >
              <span className={styles.quickMenuEmoji} aria-hidden="true">
                🧩
              </span>
              <span className={styles.quickMenuText}>
                <strong>Baza zadań</strong>
                <span>Otwórz listę, szablony i edycję.</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {!display.kidsMode && quickMenuOpen && isPointsPage && (
        <div className={styles.quickMenuOverlay} onClick={() => setQuickMenuOpen(false)}>
          <div className={styles.quickMenu} role="menu" aria-label="Dodaj nagrodę" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.quickMenuAction}
              onClick={() => handleAddReward('family')}
              role="menuitem"
            >
              <span className={styles.quickMenuEmoji} aria-hidden="true">
                👨‍👩‍👧
              </span>
              <span className={styles.quickMenuText}>
                <strong>Dla rodziny</strong>
                <span>Nagroda wspólna dla wszystkich.</span>
              </span>
            </button>

            <button
              type="button"
              className={styles.quickMenuAction}
              onClick={() => handleAddReward('child')}
              role="menuitem"
            >
              <span className={styles.quickMenuEmoji} aria-hidden="true">
                🧒
              </span>
              <span className={styles.quickMenuText}>
                <strong>Dla dziecka</strong>
                <span>Nagroda widoczna dla dzieci.</span>
              </span>
            </button>

            <button
              type="button"
              className={styles.quickMenuAction}
              onClick={() => handleAddReward('adult')}
              role="menuitem"
            >
              <span className={styles.quickMenuEmoji} aria-hidden="true">
                🧑
              </span>
              <span className={styles.quickMenuText}>
                <strong>Dla dorosłego</strong>
                <span>Nagroda ukryta w trybie dziecięcym.</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
